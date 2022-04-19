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

import * as childProcess from 'child_process';

import { getLogger } from '@iex/shared/logger';

const logger = getLogger('exec');

export const exec = async (command: string): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    logger.trace(`Executing command ${command}`);
    childProcess.exec(command, (err, stdout, stderr) => {
      logger.trace(`stdout: `);
      logger.trace(stdout);
      logger.trace(`stderr: `);
      logger.trace(stderr);

      if (err) {
        logger.error('Failed: ' + err);
        reject(err);
      }

      resolve({ stdout, stderr });
    });
  });
};
