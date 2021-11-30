/**
 * Copyright 2021 Expedia, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { IndexedInsight } from '@iex/models/indexed/indexed-insight';
import { IndexedInsightUser } from '@iex/models/indexed/indexed-insight-user';
import { ItemType } from '@iex/models/item-type';
import { PersonType } from '@iex/models/person-type';
import { RepositoryType } from '@iex/models/repository-type';
import { MessageQueue } from '@iex/mq/message-queue';
import logger from '@iex/shared/logger';
import { nanoid } from 'nanoid';
import pMap from 'p-map';

import { GitInstance, INSIGHT_YAML_FILE } from '../../lib/git-instance';
import { writeToS3 } from '../../lib/storage';
import { InsightFile, InsightFileConversion } from '../../models/insight-file';
import { InsightSyncTask } from '../../models/tasks';
import { ActivityService } from '../../services/activity.service';
import { UserService } from '../../services/user.service';
import { getTypeAsync } from '../../shared/mime';

import { BaseSync } from './base.sync';
import { getRepository, makeOctokit, withRetries } from './github';

const THUMBNAIL_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
const THUMBNAIL_LOCATIONS = ['thumbnail', '.iex/thumbnail'].flatMap((prefix) =>
  THUMBNAIL_EXTENSIONS.map((extension) => prefix + extension)
);

const READONLY_FILES = new Set(['insight.yml']);

export class GitHubRepositorySync extends BaseSync {
  async sync(insightSyncTask: InsightSyncTask): Promise<IndexedInsight | null> {
    // Check for previously-synced Insight
    const previousInsight = await super.getPreviouslySyncedInsight(insightSyncTask);

    const insight = await githubRepositorySync(insightSyncTask, previousInsight);

    if (insight != null) {
      if (insight.repository.isArchived) {
        return null;
      }

      await super.updateDatabase(insightSyncTask, insight);
      await super.publishInsight(insight, insightSyncTask.refresh);
    }

    return insight;
  }
}

export async function getInsightFromRepository(owner: string, repo: string): Promise<IndexedInsight> {
  const repository = await getRepository(owner, repo);
  logger.debug(JSON.stringify(repository, null, 2));

  // GraphQL API doesn't have an equivalent mutation for this.
  const contributorsResult = await withRetries<any>(() =>
    makeOctokit().repos.getContributorsStats({
      owner,
      repo
    })
  );

  logger.debug('[GITHUB] Retrieved Contributor details from GitHub API ' + repository.nameWithOwner);

  const userServices = new UserService(new ActivityService());
  const contributors = await pMap(
    contributorsResult,
    async ({ author }: any): Promise<IndexedInsightUser> => {
      const user = await userServices.getUserByGitHubLogin(author.login);
      if (user === null) {
        // This means we detected a GitHub user who isn't an IEX user.
        // Make do with what we have
        return {
          userName: author.login,
          displayName: author.login,
          email: 'unknown',
          gitHubUser: {
            login: author.login,
            type: PersonType.USER,
            avatarUrl: author.avatar_url,
            externalId: author.node_id
          }
        };
      }

      return {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        gitHubUser: {
          login: author.login,
          type: PersonType.USER,
          avatarUrl: author.avatar_url,
          externalId: author.node_id
        }
      };
    }
  );

  const insight: IndexedInsight = {
    itemType: ItemType.INSIGHT,
    namespace: repository.owner.login,
    name: repository.name,
    fullName: `${repository.owner.login}/${repository.name}`,
    description: repository.description ?? '',
    contributors,
    createdAt: repository.createdAt!,
    updatedAt: repository.updatedAt!,
    syncedAt: new Date().toISOString(),
    stars: repository.stargazers!.totalCount,
    forks: repository.forkCount!,
    tags: repository.repositoryTopics!.edges.map(({ node }: any) => node.topic.name),
    repository: {
      externalId: repository.id,
      externalFullName: repository.nameWithOwner!,
      externalName: repository.name,
      type: RepositoryType.GITHUB,
      defaultBranch: repository.defaultBranchRef?.name || 'master',
      url: repository.url,
      cloneUrl: repository.cloneUrl,
      owner: {
        type: (repository.owner.__typename! as string) as PersonType,
        login: repository.owner.login,
        externalId: repository.owner.id,
        avatarUrl: repository.owner.avatarUrl!
      },
      isMissing: false,
      isArchived: repository.isArchived
    }
  };

  logger.debug(JSON.stringify(insight, null, 2));

  return insight;
}

/**
 * Function to sync a repository from GitHub into IEX.
 *
 * @param item Insight Sync task
 */
export const githubRepositorySync = async (
  item: InsightSyncTask,
  previousInsight: IndexedInsight | null
): Promise<IndexedInsight | null> => {
  logger.info(`[GITHUB_SYNC] Processing item: ${item.owner}/${item.repo}`);
  logger.debug(JSON.stringify(item, null, 2));

  let gitInstance: GitInstance | null = null;
  try {
    // Load insight details from GitHub metadata
    const insight = await getInsightFromRepository(item.owner, item.repo);

    // Short-circuit if the repository is archived
    if (insight.repository.isArchived) {
      logger.warn(`[GITHUB_SYNC] This repository is archived; stopping sync`);
      return insight;
    }

    // Clone the repository locally
    gitInstance = await GitInstance.from(insight.repository.cloneUrl, <string>process.env.GITHUB_ACCESS_TOKEN);

    // Ensure there is an `insight.yml` file in the repository
    if (!gitInstance.fileExists(INSIGHT_YAML_FILE)) {
      logger.warn(`[GITHUB_SYNC] This repository has no \`${INSIGHT_YAML_FILE}\`; skipping sync`);
      return null;
    }

    // Scrape contents of `insight.yml` and `README.md`
    const [yaml, readme] = await Promise.all([
      gitInstance.retrieveInsightYaml(),
      gitInstance.retrieveFileUtf8('README.md')
    ]);

    applyInsightYaml(yaml, insight);
    applyReadme(readme, insight);

    // Format all tags into lowercase, then dedupe using a Set
    insight.tags = [...new Set(insight.tags.map((tag) => tag.toLowerCase()))];

    // Check for special tags
    // DEPRECATED--will be removed shortly
    if (insight.tags.includes('iex-template')) {
      insight.itemType = ItemType.TEMPLATE;
    }

    await syncFiles(gitInstance, insight, previousInsight);

    // Determine thumbnail
    // TODO: support insight.yml configuration
    const thumbnail = THUMBNAIL_LOCATIONS.find((path) => gitInstance!.fileExists(path));

    if (thumbnail) {
      insight.thumbnailUrl = thumbnail;
    }

    // Done!
    logger.debug(JSON.stringify(insight, null, 2));

    return insight;
  } finally {
    if (gitInstance != null) {
      await gitInstance.cleanup();
    }
  }
};

/**
 * Attempts to retrieve an existing file id, or generate a new one.
 * The goal is to keep the file id constant across repeated syncs of the Insight.
 *
 * @param previousFile Previous Insight File
 */
const getFileId = (previousFile?: InsightFile): string => {
  if (previousFile != null && previousFile.id != null) {
    return previousFile.id;
  }

  return nanoid();
};

/**
 * Attempts to retrieve the corresponding file from the previously synced Insight.
 *
 * @param insightFile Insight File
 * @param previousInsight Previously-synced Insight (if any)
 */
const getPreviousFile = (
  insightFile: Partial<InsightFile>,
  previousInsight: IndexedInsight | null
): InsightFile | undefined => {
  if (previousInsight != null && previousInsight.files && previousInsight.files.length > 0) {
    const existingFile = previousInsight.files.find((file) => {
      // Match existing files by path
      // This means renamed files won't match
      return file.name == insightFile.name && file.path == insightFile.path;
    });

    if (existingFile != null && existingFile.id != null) {
      return existingFile;
    }
  }

  return undefined;
};

const applyInsightYaml = async (yaml: any, insight: IndexedInsight): Promise<void> => {
  logger.debug(JSON.stringify(yaml, null, 2));

  // Merge any fields from `insight.yml`
  if (yaml.name != null) {
    insight.name = yaml.name.trim();
  }
  if (yaml.description != null) {
    insight.description = yaml.description?.trim();
  }
  if (yaml.tags != null && Array.isArray(yaml.tags)) {
    // It's possible for the GitHub repo to have different tags than the YAML, so concat
    // We'll dedupe and standardize later
    insight.tags = [...insight.tags, ...yaml.tags];
  }
  if (yaml.creation != null) {
    insight.creation = yaml.creation;
  }

  if (yaml.metadata != null) {
    insight.metadata = yaml.metadata;
  }

  // Default to Insight if not set
  insight.itemType = yaml.itemType ?? ItemType.INSIGHT;
};

const applyReadme = async (readme: string | null, insight: IndexedInsight): Promise<void> => {
  // Merge `README.md`
  insight.readme = {
    path: 'README.md',
    contents: readme || ''
  };
};

/**
 * Given a file, returns a list of one or more conversions (if any),
 * or undefined if the file doesn't need to be converted.
 */
const getConversions = (insightFile: Omit<InsightFile, 'id'>): undefined | InsightFileConversion[] => {
  switch (insightFile.mimeType) {
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return [
        {
          mimeType: 'application/pdf',
          path: `.converted/${insightFile.path}.pdf`
        }
      ];
    case 'application/x-ipynb+json':
      return [
        {
          mimeType: 'application/pdf',
          path: `.converted/${insightFile.path}.pdf`
        },
        {
          mimeType: 'text/html',
          path: `.converted/${insightFile.path}.html`
        }
      ];
    default:
      return undefined;
  }
};

const syncFiles = async (
  gitInstance: GitInstance,
  insight: IndexedInsight,
  previousInsight: IndexedInsight | null
): Promise<void> => {
  // Message Queue for converting files
  const conversionMq = new MessageQueue({ region: process.env.S3_REGION, queueUrl: process.env.CONVERSION_SQS_URL });

  // Walk repo to discover files
  const files = await gitInstance.listFiles((wf) => !['.ds_store'].includes(wf.name.toLowerCase()));

  // Process each file and map into the Insight
  insight.files = await pMap(
    files,
    async (wf) => {
      const contents = await gitInstance!.retrieveFile(wf.path);

      const file: Omit<InsightFile, 'id'> = {
        name: wf.name,
        path: wf.path,
        size: wf.stats.size,
        encoding: wf.encoding,
        mimeType: await getTypeAsync({ fileName: wf.name, buffer: contents }),
        hash: wf.hash,
        readonly: READONLY_FILES.has(wf.path)
        //contents: contents!
      };

      file.conversions = getConversions(file);

      const previousFile = getPreviousFile(file, previousInsight);

      // We only need to update S3 if the file is new or the hash changes
      if (previousFile === undefined || previousFile.hash !== file.hash) {
        logger.silly(`[GITHUB_SYNC] Found new/modified file: ${file.path}`);

        const targetS3Path = `insights/${insight.fullName}/files/${wf.path}`;

        await writeToS3(contents!, targetS3Path);

        if (file.conversions !== undefined) {
          // Submit a conversion request for this file
          await conversionMq.sendMessage({
            source: {
              uri: `s3://${process.env.S3_BUCKET}/${targetS3Path}`,
              mimeType: file.mimeType,
              hash: file.hash
            },
            targets: file.conversions.map((c) => ({
              uri: `s3://${process.env.S3_BUCKET}/insights/${insight.fullName}/files/${c.path}`,
              mimeType: c.mimeType
            }))
          });
        }
      } else {
        logger.silly(`[GITHUB_SYNC] Found unmodified file: ${file.path}`);
      }

      return {
        ...file,
        id: getFileId(previousFile)
      };
    },
    { concurrency: Number.parseInt(process.env.S3_CONCURRENCY_LIMIT || '10') }
  );
};
