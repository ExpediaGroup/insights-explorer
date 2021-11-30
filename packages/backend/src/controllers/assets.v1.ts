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

import fs from 'fs';
import path from 'path';

import { Response, Request } from 'express';

/**
 * GET /changelog
 */
export const getChangelog = async (req: Request, res: Response): Promise<void> => {
  res.contentType('text/markdown');
  fs.createReadStream(path.join(__dirname, '../../../../../CHANGELOG.md')).pipe(res);
};

/**
 * GET /markdown
 */
export const getMarkdown = async (req: Request, res: Response): Promise<void> => {
  res.contentType('text/markdown');
  fs.createReadStream(path.join(__dirname, '../../../../../markdown.md')).pipe(res);
};
