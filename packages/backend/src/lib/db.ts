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

import { getLogger } from '@iex/shared/logger';
import knex, { Knex } from 'knex';
import { Model, knexSnakeCaseMappers } from 'objection';

const logger = getLogger('db');

const defaultOptions: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  },
  pool: {
    afterCreate: (conn: any, done: any) => {
      conn.query('SET search_path TO iex', function (err: any) {
        done(err, conn);
      });
    }
  },
  log: {
    debug(message: string | { sql: string } | Array<{ sql: string }>): void {
      if (typeof message == 'string') {
        logger.debug('[SQL] ' + message);
      } else if (Array.isArray(message)) {
        logger.debug('[SQL] ' + message[0].sql);
      } else {
        logger.debug('[SQL] ' + message.sql);
      }
    },
    error: logger.error,
    warn: logger.warn,
    deprecate: logger.warn
  },
  migrations: {
    //   // This is missing from the TypeScript types currently.
    tableName: 'migrations',
    directory: './migrations'
  },

  // Enable to see raw queries; disable in production
  debug: process.env.DB_DEBUG === 'true',

  acquireConnectionTimeout: 90_000,

  // Automatically convert from snake_case to camelCase
  ...knexSnakeCaseMappers()
};

export function createDb(options: Knex.Config = defaultOptions): Knex {
  const mergedOptions = { ...defaultOptions, ...options };
  const instance = knex(mergedOptions);
  return instance;
}

export async function bootstrap(knex: Knex): Promise<void> {
  if (process.env.DB_INIT_ON_STARTUP !== 'true') {
    return;
  }

  await knex.migrate.latest();
}

const knexInstance = createDb();

// Bind models to Knex
Model.knex(knexInstance);

export const defaultKnex = knexInstance;
