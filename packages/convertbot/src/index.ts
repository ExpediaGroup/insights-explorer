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

/* eslint-disable import/order */
import 'reflect-metadata';
import * as moduleAlias from 'module-alias';

// Module-alias rewrites imports to work with the compiled paths
// Define all `paths` from tsconfig.json here
//
// Read more about this issue here:
// https://github.com/microsoft/TypeScript/issues/26722
const packages = ['models', 'mq', 'shared'];
for (const packageName of packages) {
  moduleAlias.addAlias(`@iex/${packageName}`, `${__dirname}/../../../${packageName}/dist`);
}

import './environment';
import type { Server } from 'http';

import app from './server';
import { getLogger } from '@iex/shared/logger';

const logger = getLogger('index');

// Safeguard to prevent the application from crashing.
process.on('uncaughtException', (uncaughtException) => {
  logger.error(`Unhandled Exception! ${uncaughtException}`);
  logger.error(JSON.stringify(uncaughtException, null, 2));
});

const startup = async (): Promise<Server> => {
  // Start Express server
  logger.debug('Starting Express server');
  const server = app.listen(app.get('port'), () => {
    logger.info(`IEX Convertbot started in ${app.get('env')} mode on port: ${app.get('port')}`);
  });

  return server;
};

startup();
