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
import pRetry from 'p-retry';

import { bootstrap, defaultKnex } from './lib/db';
import { deployMappings } from './lib/elasticsearch';
import { createServer } from './server';
import logger from '@iex/shared/logger';
import { syncExampleInsights } from './lib/init';

// Safeguard to prevent the application from crashing.
// It would be better to catch any promise rejections and handle directly
process.on('unhandledRejection', (unhandledPromiseRejection) => {
  logger.error(`Unhandled Promise Rejection Warning! ${unhandledPromiseRejection}`);
  logger.error(JSON.stringify(unhandledPromiseRejection, null, 2));
});

process.on('uncaughtException', (uncaughtException) => {
  logger.error(`Unhandled Exception! ${uncaughtException}`);
  logger.error(JSON.stringify(uncaughtException, null, 2));
});

const startup = async (): Promise<Server> => {
  // Deploy Elasticsearch Index mappings
  logger.debug('[INDEX] Deploying elasticsearch indices');
  await pRetry(() => deployMappings(), {
    retries: 5,
    factor: 3.86,
    onFailedAttempt: (error) => {
      logger.warn(`[INDEX] Deploying elasticsearch indices failed (attempt ${error.attemptNumber})`);
    }
  });

  // Create database pool & apply any schema migrations
  logger.debug('[INDEX] Bootstrapping database');
  await pRetry(() => bootstrap(defaultKnex), {
    retries: 5,
    factor: 3.86,
    onFailedAttempt: (error) => {
      logger.warn(`[INDEX] Bootstrapping database failed (attempt ${error.attemptNumber})`);
      logger.warn(error);
    }
  });

  // Start Express server
  logger.debug('[INDEX] Starting Express server');
  const app = await createServer();
  const server = app.listen(app.get('port'), () => {
    logger.info(`IEX Server started in ${app.get('env')} mode on port: ${app.get('port')}`);
  });

  // Load example Insights from the `examples` package
  if (process.env.EXAMPLES_INIT_ON_STARTUP === 'true') {
    syncExampleInsights();
  }

  return server;
};

startup();
