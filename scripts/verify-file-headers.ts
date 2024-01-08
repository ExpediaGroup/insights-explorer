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
import { exit } from 'process';

import globby from 'globby';

const COPYRIGHT_MATCH = /^\/\*\*\n \* Copyright \d{4} Expedia, Inc./;

/* eslint-disable no-console */
async function verifyFileHeaders() {
  const paths = await globby(['./**/*.{ts,js,css}', '!packages/backend/migrations/*'], {
    gitignore: true
  });

  const promises = await Promise.all(
    paths.map(async (path) => {
      const contents = await fs.promises.readFile(path);
      return contents.toString('utf8').match(COPYRIGHT_MATCH) === null ? path : undefined;
    })
  );
  const filesWithoutCopyrightHeader = promises.filter((path) => path !== undefined);

  if (filesWithoutCopyrightHeader.length > 0) {
    console.error(
      `\n🚨 The following files are missing a valid copyright header:${filesWithoutCopyrightHeader
        .map((file) => `\n   • ${file}`)
        .join(',')}`
    );
    exit(1);
  }

  console.info('All files contain a valid copyright header!');
}

// eslint-disable-next-line unicorn/prefer-top-level-await
verifyFileHeaders();
