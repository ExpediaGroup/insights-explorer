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

import type { Sort } from '../models/generated/graphql';

export const generateSearchUrl = (
  query: string | undefined,
  sort: Sort | undefined,
  useNewSearch?: boolean | undefined
) => {
  const path = `/${encodeURIComponent(query || '')}`;
  const searchParams: string[] = [];
  if (sort != null) {
    if (sort.field !== undefined) {
      searchParams.push(`sort=${sort.field}`);
    }
    if (sort.direction !== undefined) {
      searchParams.push(`dir=${sort.direction}`);
    }
  }
  if (useNewSearch === false) {
    searchParams.push(`legacySearch=true`);
  }

  return searchParams.length > 0 ? `${path}?${searchParams.join('&')}` : path;
};
