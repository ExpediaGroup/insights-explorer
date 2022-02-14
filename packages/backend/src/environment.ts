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

import logger from '@iex/shared/logger';
import * as dotenv from 'dotenv-flow';
import fs from 'fs-extra';

// Dynamically load current IEX version
try {
  const packageJson = fs.readJsonSync(__dirname + `/../../../../package.json`);
  process.env.IEX_VERSION = packageJson.version;
} catch {
  logger.error('[ENV] Error loading package.json');
  process.env.IEX_VERSION = 'unknown';
}

// Ensure NODE_ENV is set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment file(s)
const result = dotenv.config({
  path: './env/'
});

if (result.error) {
  throw result.error;
}
