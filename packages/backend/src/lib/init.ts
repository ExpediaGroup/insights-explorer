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

import fs from 'fs';
import path from 'path';

import { RepositoryType } from '@iex/models/repository-type';
import { getLogger } from '@iex/shared/logger';

import { syncInsight } from './backends/sync';

const logger = getLogger('init');

export async function syncExampleInsights(): Promise<void> {
  const exampleDirectory = path.join(__dirname, '../../../../examples/insights');
  // Find all examples
  const exampleInsights = fs
    .readdirSync(exampleDirectory, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(exampleDirectory, dirent.name));

  for (const exampleInsight of exampleInsights) {
    try {
      await syncInsight({
        repositoryType: RepositoryType.FILE,
        owner: 'local',
        repo: exampleInsight
      });
    } catch (error: any) {
      logger.error(`Error syncing example Insight: ${exampleInsight}`);
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      return error;
    }
  }
}
