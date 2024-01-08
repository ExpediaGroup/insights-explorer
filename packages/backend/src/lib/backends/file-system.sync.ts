/**
 * Copyright 2022 Expedia, Inc.
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
import { getLogger } from '@iex/shared/logger';
import { Storage } from '@iex/shared/storage';
import { nanoid } from 'nanoid';
import pMap from 'p-map';
import readingTime from 'reading-time';
import Container from 'typedi';

import { InsightYaml } from '@iex/backend/models/insight-yaml';

import { InsightFile, InsightFileConversion } from '../../models/insight-file';
import { InsightSyncTask } from '../../models/tasks';
import { ActivityService } from '../../services/activity.service';
import { UserService } from '../../services/user.service';
import { getTypeAsync } from '../../shared/mime';
import { GitInstance, INSIGHT_YAML_FILE } from '../git-instance';

import { BaseSync, INDEXABLE_MIME_TYPES, READONLY_FILES, THUMBNAIL_LOCATIONS } from './base.sync';

const logger = getLogger('file-system.sync');

/**
 * Sync Insights from the local filesystem.
 */
export class FileSystemSync extends BaseSync {
  async sync(insightSyncTask: InsightSyncTask): Promise<IndexedInsight | null> {
    const startTime = process.hrtime.bigint();

    // Get last directory name from the path
    const name = insightSyncTask.repo.split('/')?.pop() || insightSyncTask.repo;
    const namespace = insightSyncTask.owner;
    const path = insightSyncTask.repo;

    // Check for previously-synced Insight
    const previousInsight = await super.getPreviouslySyncedInsight(`${namespace}/${name}`);

    const insight = await getInsight(namespace, name, path, previousInsight);

    if (insight != null) {
      if (insight.repository.isArchived) {
        return null;
      }

      await super.updateDatabase(insightSyncTask, insight);
      await super.publishInsight(insight, insightSyncTask.refresh);
    }

    const endTime = process.hrtime.bigint();
    const elapsedTime = Number(endTime - startTime) / 1e9;
    logger.info(`Sync for ${path} took ${elapsedTime} seconds`);

    return insight;
  }
}

async function getInsightContributors(insight: IndexedInsight, yaml: InsightYaml): Promise<IndexedInsightUser[]> {
  const userServices = new UserService(new ActivityService());

  // If authors is manually specified in the YAML, use that instead of the GitHub API
  if (yaml.authors && yaml.authors.length > 0) {
    const contributors = await pMap(yaml.authors, async (author) => {
      const user = await userServices.getUserByEmail(author);

      return user == null
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

    return contributors;
  }

  // File system Insights only support collaborators in the YAML
  return [];
}

/**
 * Function to sync an Insight from the file system into an Insight.
 *
 */
export const getInsight = async (
  namespace: string,
  name: string,
  path: string,
  previousInsight: IndexedInsight | null
): Promise<IndexedInsight | null> => {
  logger.info(`Processing item: ${namespace}/${name}`);

  // Load insight details
  const insight: IndexedInsight = {
    itemType: ItemType.INSIGHT,
    namespace,
    name,
    fullName: `${namespace}/${name}`,
    description: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
    tags: [],
    contributors: [],
    _collaborators: [],
    repository: {
      externalId: path,
      externalFullName: `${namespace}/${name}`,
      externalName: path,
      type: RepositoryType.FILE,
      defaultBranch: 'none',
      url: path,
      cloneUrl: path,
      owner: {
        externalId: namespace,
        type: PersonType.FILE_SYSTEM,
        login: namespace
      },
      isMissing: false,
      isArchived: false,
      // File Insights are always read-only (for now)
      isReadOnly: true,
      forks: 0,
      stars: 0
    },
    commentCount: 0,
    likeCount: 0,
    viewCount: 0
  };

  // Clone the repository locally
  const gitInstance = await GitInstance.fromLocalPath(path);

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

  // Determine thumbnail
  // TODO: support insight.yml configuration
  const thumbnail = THUMBNAIL_LOCATIONS.find((path) => gitInstance!.fileExists(path));

  if (thumbnail) {
    insight.thumbnailUrl = thumbnail;
  }

  // Done!
  logger.trace(JSON.stringify(insight, null, 2));

  return insight;
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

  // Default to Insight if not set
  insight.itemType = yaml.itemType ?? ItemType.INSIGHT;
  insight.isUnlisted = false;
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
