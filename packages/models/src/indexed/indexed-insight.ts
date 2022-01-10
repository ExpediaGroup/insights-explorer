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

import type { ItemType } from '../item-type';

import type { IndexedInsightCreation } from './indexed-insight-creation';
import type { IndexedInsightFile } from './indexed-insight-file';
import type { IndexedInsightMetadata } from './indexed-insight-metadata';
import type { IndexedInsightReadme } from './indexed-insight-readme';
import type { IndexedInsightUser } from './indexed-insight-user';
import type { IndexedRepository } from './indexed-repository';

/**
 * Model for an indexed Insight, rather than the API model.
 */
export interface IndexedInsight {
  itemType: ItemType;

  insightId?: number;

  namespace: string;
  name: string;
  fullName: string;

  thumbnailUrl?: string;

  description?: string;
  tags: string[];

  repository: IndexedRepository;

  contributors: IndexedInsightUser[];

  createdAt: string;
  updatedAt: string;
  syncedAt: string;

  stars: number;
  forks: number;

  readme?: IndexedInsightReadme;

  files?: IndexedInsightFile[];

  creation?: IndexedInsightCreation;

  metadata?: IndexedInsightMetadata;
}
