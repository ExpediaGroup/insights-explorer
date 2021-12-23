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

import { RepositoryType } from '@iex/models/repository-type';

export interface InsightSyncTask {
  repositoryType: RepositoryType;
  owner: string;
  repo: string;

  /**
   * Optional flag that triggers an immediate refresh of the Elasticsearch index.
   * Set this true when making user-initiated requests that need to be immediately
   * visible after indexing.
   */
  refresh?: boolean;

  /**
   * Optional flag that indicates the repository was just updated.
   *
   * If true, the sync task will use the current time as the `updatedAt` field,
   * rather than the repository's `updatedAt` field value.
   *
   * This avoids any potential sychronization issues with the repository.
   */
  updated?: boolean;
}
