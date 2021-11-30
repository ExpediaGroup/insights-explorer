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

import { InsightFile as InsightFileGQL } from './generated/graphql';

// TODO: Replace with a generated GraphQL enum
export enum InsightFileAction {
  ADD = 'add',
  DELETE = 'delete',
  MODIFY = 'modify',
  NONE = 'none',
  RENAME = 'rename'
}

export interface InsightFile extends Partial<InsightFileGQL> {
  id: string;
  path: string;
  name: string;
  action?: InsightFileAction;
  mimeType?: string;
  originalPath?: string;
  readonly?: boolean;
}

export interface InsightFolder {
  id: string;
  path: string;
  name: string;
  tree: FileOrFolder[];
  readonly?: boolean;
  action?: InsightFileAction;
}
export type FileOrFolder = InsightFile | InsightFolder;
