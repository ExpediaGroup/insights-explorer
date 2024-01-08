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
import { RepositoryType } from '@iex/models/repository-type';
import { getLogger } from '@iex/shared/logger';

import { GitHubRepositorySync } from '../../lib/backends/github.sync';
import { InsightSyncTask } from '../../models/tasks';

import { BaseSync } from './base.sync';
import { FileSystemSync } from './file-system.sync';

const logger = getLogger('sync');

export async function syncInsight(insightSyncTask: InsightSyncTask): Promise<IndexedInsight | null> {
  logger.debug('Syncing Insight');

  let syncer: BaseSync;
  switch (insightSyncTask.repositoryType) {
    case RepositoryType.GITHUB: {
      syncer = new GitHubRepositorySync();
      break;
    }
    case RepositoryType.FILE: {
      syncer = new FileSystemSync();
      break;
    }
    default: {
      throw new Error('Unknown Repository Type');
    }
  }

  return syncer.sync(insightSyncTask);
}
