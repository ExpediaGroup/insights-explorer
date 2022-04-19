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
import { getLogger } from '@iex/shared/logger';
import BetterQueue from 'better-queue';

import { InsightSyncTask } from '../models/tasks';

import { syncInsight } from './backends/sync';

const logger = getLogger('insight-queue');

/**
 * Queue processing function.
 *
 * @param item Insight Sync task
 * @param callback Callback
 */
const queueHandler: BetterQueue.ProcessFunction<InsightSyncTask, IndexedInsight | null> = async (
  item: InsightSyncTask,
  callback
) => {
  logger.info(`Processing item: ${item.owner}/${item.repo}`);

  try {
    const insight = await syncInsight(item);
    callback(null, insight);
  } catch (error: any) {
    logger.error(`Error syncing insight ${item.owner}/${item.repo}`);
    logger.error(JSON.stringify(error, null, 2));

    callback(null);
  }
};

// Task queue
const insightQueue = new BetterQueue(queueHandler);

// Error Handling
insightQueue.on('task_failed', function (taskId, errorMessage) {
  logger.error(errorMessage);
});

export default insightQueue;
