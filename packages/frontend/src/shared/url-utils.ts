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

import urljoin from 'url-join';

export function isAbsoluteUrl(url: string) {
  return /(?:^[a-z][a-z0-9+.-]*:|\/\/)/.test(url);
}

export function isRelativeUrl(url: string) {
  return !isAbsoluteUrl(url);
}

export function isHashUrl(url: string) {
  return /^#/.test(url);
}

export type MaybeUndefined<T> = undefined extends T ? undefined : never;

export function getCompletePath<T>(baseUrl: string, path?: T, download = false): string | MaybeUndefined<T> {
  if (path === undefined) {
    return undefined as MaybeUndefined<T>;
  }

  baseUrl = baseUrl.replace(':3000', ':3001');
  let filePath = (baseUrl !== undefined && path !== undefined && urljoin(baseUrl, path)) ?? '';

  if (download && window.location.href.startsWith('http://localhost:3000')) {
    filePath = `http://localhost:3001${filePath}`;
  }

  return filePath;
}

export { urljoin };
