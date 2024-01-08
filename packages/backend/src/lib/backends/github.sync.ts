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
import { IndexedInsightCollaborator } from '@iex/models/indexed/indexed-insight-collaborator';
import { IndexedInsightUser } from '@iex/models/indexed/indexed-insight-user';
import { ItemType } from '@iex/models/item-type';
import { PersonType } from '@iex/models/person-type';
import { RepositoryType } from '@iex/models/repository-type';
import { MessageQueue } from '@iex/mq/message-queue';
import { getLogger } from '@iex/shared/logger';
import { Storage } from '@iex/shared/storage';
import { nanoid } from 'nanoid';
import pMap from 'p-map';
import readingTime from 'reading-time';
import Container from 'typedi';

import { GitInstance, INSIGHT_YAML_FILE } from '../../lib/git-instance';
import { Insight } from '../../models/insight';
import { InsightFile, InsightFileConversion } from '../../models/insight-file';
import { InsightYaml } from '../../models/insight-yaml';
import { InsightSyncTask } from '../../models/tasks';
import { InsightService } from '../../services/insight.service';
import { UserService } from '../../services/user.service';
import { getTypeAsync } from '../../shared/mime';

import { BaseSync, INDEXABLE_MIME_TYPES, READONLY_FILES, THUMBNAIL_LOCATIONS } from './base.sync';
import { getRepository, makeOctokit, withRetries } from './github';

const logger = getLogger('github.sync');

const IGNORE_AUTHORS = process.env.INSIGHT_IGNORE_AUTHORS?.split(';') ?? [];

export class GitHubRepositorySync extends BaseSync {
  async sync(insightSyncTask: InsightSyncTask): Promise<IndexedInsight | null> {
    const startTime = process.hrtime.bigint();

    // Check for previously-synced Insight
    const previousInsight = await super.getPreviouslySyncedInsight(`${insightSyncTask.owner}/${insightSyncTask.repo}`);

    const insight = await githubRepositorySync(insightSyncTask, previousInsight);

    if (insight != null) {
      if (insight.repository.isArchived) {
        return null;
      }

      // If the Insight was renamed, this needs to be updated in the database
      const updatedInsightSyncTask = {
        ...insightSyncTask,
        owner: insight.namespace,
        repo: insight.repository.externalName
      };

      await super.updateDatabase(updatedInsightSyncTask, insight);
      await super.publishInsight(insight, insightSyncTask.refresh);
    }

    const endTime = process.hrtime.bigint();
    const elapsedTime = Number(endTime - startTime) / 1e9;
    logger.info(`Sync for ${insightSyncTask.owner}/${insightSyncTask.repo} took ${elapsedTime} seconds`);

    return insight;
  }
}

export async function getInsightFromRepository(owner: string, repo: string): Promise<IndexedInsight> {
  const repository = await getRepository(owner, repo);
  logger.debug(JSON.stringify(repository, null, 2));

  const insight: IndexedInsight = {
    itemType: ItemType.INSIGHT,
    namespace: repository.owner.login,
    name: repository.name,
    fullName: `${repository.owner.login}/${repository.name}`,
    description: repository.description ?? '',
    createdAt: repository.createdAt!,
    updatedAt: repository.updatedAt!,
    syncedAt: new Date().toISOString(),
    tags: repository.repositoryTopics!.edges.map(({ node }: any) => node.topic.name),
    contributors: [],
    repository: {
      externalId: repository.id,
      externalFullName: repository.nameWithOwner!,
      externalName: repository.name,
      type: RepositoryType.GITHUB,
      defaultBranch: repository.defaultBranchRef?.name || 'master',
      url: repository.url,
      cloneUrl: repository.cloneUrl,
      owner: {
        type: repository.owner.__typename! as string as PersonType,
        login: repository.owner.login,
        externalId: repository.owner.id,
        avatarUrl: repository.owner.avatarUrl!
      },
      isMissing: false,
      isArchived: repository.isArchived,
      isReadOnly: repository.isArchived,
      forks: repository.forkCount!,
      stars: repository.stargazers!.totalCount
    }
  };

  logger.debug(JSON.stringify(insight, null, 2));

  return insight;
}

/**
 * Filters a list of Insight contributors using multiple criteria:
 *  - Environment variable INSIGHT_IGNORE_AUTHORS may contain usernames/emails that should be ignored globally
 *  - Insight YAML may contain a field `excludedAuthors` that contains usernames/emails that should be ignored for that Insight
 *
 * @param contributors Original list of Insight contributors
 * @param yaml Insight YAML
 * @returns Filtered list of Insight contributors
 */
function excludeContributors(contributors: IndexedInsightUser[], yaml: InsightYaml): IndexedInsightUser[] {
  return contributors.filter((c) => {
    // Remove any contributors in the `INSIGHT_IGNORE_AUTHORS` config
    const ignored = IGNORE_AUTHORS.includes(c.email) || IGNORE_AUTHORS.includes(c.userName);
    if (ignored) {
      logger.info(
        `Excluding contributor ${
          c.email === 'unknown' ? c.userName : c.email
        } due to INSIGHT_IGNORE_AUTHORS environment variable`
      );
      return false;
    }

    // If excludedAuthors is specified in the YAML, use that to filter results
    if (yaml.excludedAuthors && yaml.excludedAuthors.length > 0) {
      const excluded = yaml.excludedAuthors!.includes(c.email) || yaml.excludedAuthors!.includes(c.userName);
      if (excluded) {
        logger.info(`Excluding contributor ${c.email === 'unknown' ? c.userName : c.email} due to YAML`);
        return false;
      }
    }

    return true;
  });
}

async function getInsightContributors(insight: IndexedInsight, yaml: InsightYaml): Promise<IndexedInsightUser[]> {
  const userService = Container.get(UserService);

  // If authors is manually specified in the YAML, use that instead of the GitHub API
  if (yaml.authors && yaml.authors.length > 0) {
    const contributors = await pMap(yaml.authors, async (author) => {
      const user = await userService.getUserByEmail(author);

      return user === undefined
        ? {
            userName: author,
            displayName: author,
            email: author
          }
        : {
            userId: user.userId,
            userName: user.userName,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar
          };
    });

    // Filter for contributors to to be excluded
    return excludeContributors(contributors, yaml);
  }

  // GraphQL API doesn't have an equivalent mutation for this.
  const contributorsResult = await withRetries<any>(() =>
    makeOctokit().repos.getContributorsStats({
      owner: insight.repository.owner.login,
      repo: insight.repository.externalName
    })
  );

  logger.debug('Retrieved Contributor details from GitHub API ' + insight.repository.externalFullName);

  const contributors = await pMap(contributorsResult, async ({ author }: any): Promise<IndexedInsightUser> => {
    const user = await userService.getUserByGitHubLogin(author.login);
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
  });

  // Filter for contributors to to be excluded
  return excludeContributors(contributors, yaml);
}

async function getInsightCollaborators(insight: IndexedInsight): Promise<IndexedInsightCollaborator[]> {
  const insightService = Container.get(InsightService);

  // Get all collaborators for the insight -- this includes Orgs, Teams and Users
  // These are stored in Elasticsearch only for the purpose of searching for unlisted Insights
  const collaborators = await insightService.getCollaborators(insight as Insight, 'ALL');

  // Return only the fields we need
  return collaborators.map(({ permission, user }) => ({
    permission,
    user: {
      userName: user.userName,
      displayName: user.displayName,
      email: user.email
    }
  }));
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
  logger.info(`Processing item: ${item.owner}/${item.repo}`);
  logger.debug(JSON.stringify(item, null, 2));

  let gitInstance: GitInstance | null = null;
  try {
    // Load insight details from GitHub metadata
    const insight = await getInsightFromRepository(item.owner, item.repo);

    if (item.updated) {
      // If this flag is set, it means an update was just pushed.
      // Sometimes, the GitHub API hasn't recognized the update yet, so we
      // need to manually update the updatedAt field to now.
      insight.updatedAt = insight.syncedAt;
    }

    // Short-circuit if the repository is archived
    if (insight.repository.isArchived) {
      logger.warn(`This repository is archived; stopping sync`);
      return insight;
    }

    // Clone the repository locally
    gitInstance = await GitInstance.from(insight.repository.cloneUrl, <string>process.env.GITHUB_ACCESS_TOKEN);

    logger.debug(`Latest commit hash: ${await gitInstance.latestCommitHash()}`);

    // Ensure there is an `insight.yml` file in the repository
    if (!gitInstance.fileExists(INSIGHT_YAML_FILE)) {
      logger.warn(`This repository has no \`${INSIGHT_YAML_FILE}\`; skipping sync`);
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

    await syncFiles(gitInstance, insight, previousInsight);

    insight.contributors = await getInsightContributors(insight, yaml);
    insight._collaborators = await getInsightCollaborators(insight);

    // Determine thumbnail
    // TODO: support insight.yml configuration
    const thumbnail = THUMBNAIL_LOCATIONS.find((path) => gitInstance!.fileExists(path));

    if (thumbnail) {
      insight.thumbnailUrl = thumbnail;
    }

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

  if (yaml.authors != null) {
    insight.config ??= {};
    insight.config.authors = yaml.authors;
  }

  if (yaml.excludedAuthors != null) {
    insight.config ??= {};
    insight.config.excludedAuthors = yaml.excludedAuthors;
  }

  if (yaml.links != null) {
    insight.links = yaml.links;
  }

  insight.isUnlisted = yaml.isUnlisted ?? false;

  // Default to Insight if not set
  insight.itemType = yaml.itemType ?? ItemType.INSIGHT;
};

const applyReadme = async (readme: string | null, insight: IndexedInsight): Promise<void> => {
  const contents = readme || '';
  const { minutes, time, words } = readingTime(readme || '', { wordsPerMinute: 150 });

  // Merge `README.md`
  insight.readme = {
    path: 'README.md',
    contents,
    readingTime: {
      minutes,
      time,
      words
    }
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
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
      return [
        {
          mimeType: 'application/pdf',
          path: `.converted/${insightFile.path}.pdf`
        }
      ];
    }
    case 'application/x-ipynb+json': {
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
    }
    default: {
      return undefined;
    }
  }
};

const syncFiles = async (
  gitInstance: GitInstance,
  insight: IndexedInsight,
  previousInsight: IndexedInsight | null
): Promise<void> => {
  const storage = Container.get(Storage);

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
      };

      // Include the contents of text-based files
      if (INDEXABLE_MIME_TYPES.has(file.mimeType) || file.mimeType.startsWith('text/')) {
        file.contents = contents?.toString('utf8');
      }

      file.conversions = getConversions(file);

      const previousFile = getPreviousFile(file, previousInsight);

      // We only need to update S3 if the file is new or the hash changes
      if (previousFile === undefined || previousFile.hash !== file.hash) {
        logger.trace(`Found new/modified file: ${file.path}`);

        const targetS3Path = `insights/${insight.fullName}/files/${wf.path}`;

        await storage.writeFile({ body: contents!, path: targetS3Path });

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
        logger.trace(`Found unmodified file: ${file.path}`);
      }

      return {
        ...file,
        id: getFileId(previousFile)
      };
    },
    { concurrency: Number.parseInt(process.env.S3_CONCURRENCY_LIMIT || '10') }
  );
};
