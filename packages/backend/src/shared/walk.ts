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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import chardet from 'chardet';

export type WalkedFile = {
  name: string;
  path: string;
  stats: fs.Stats;
  encoding?: string;
  hash?: string;
};
export type WalkPredicate = (file: WalkedFile) => boolean;

export const createHashFromFile = async (filePath: string): Promise<string> =>
  new Promise((resolve) => {
    const hash = crypto.createHash('sha1');
    fs.createReadStream(filePath)
      .on('data', (data) => hash.update(data))
      .on('end', () => resolve(hash.digest('hex')));
  });

/**
 * Recursively walks a directory and returns an array of WalkedFiles. Directories are not included in the
 * return value; only files.
 *
 * An optional filter predicate can be used to exclude files or directories from being returned or walked.
 *
 * WalkedFile paths will be relative to the starting directory.
 *
 * @param dir Directory to walk
 * @param filter Predicate that excludes files or directories from being walked
 * @param origin Origin directory; this is initialized automatically after the first recursion
 */
export async function walk(dir: string, filter?: WalkPredicate, origin?: string): Promise<WalkedFile[]> {
  const origin2 = origin || dir;
  const files = await fs.promises.readdir(dir);

  const walkedFiles = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file);
      const stats = await fs.promises.stat(filePath);

      const walkedFile: WalkedFile = {
        name: file,
        path: path.relative(origin2, filePath),
        stats
      };

      if (filter && !filter(walkedFile)) {
        return;
      }

      if (stats.isDirectory()) {
        return walk(filePath, filter, origin2);
      } else if (stats.isFile()) {
        const [encoding, hash] = await Promise.all([chardet.detectFile(filePath), createHashFromFile(filePath)]);

        walkedFile.encoding = encoding as string;
        walkedFile.hash = hash;

        return walkedFile;
      }
    })
  );

  return walkedFiles.filter((item): item is WalkedFile | WalkedFile[] => item !== undefined).flat();
}
