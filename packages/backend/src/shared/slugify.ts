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
import deburr from 'lodash/deburr';
import kebabCase from 'lodash/kebabCase';

const logger = getLogger('slugify');

/**
 * Converts an Insight Name into a slug-ready version
 *
 * @param name Original name
 * @returns Slugified name
 */
export function slugifyInsightName(name: string): string {
  const v1 = deburr(kebabCase(name.trim()));
  const slug = v1.replaceAll('--', '-').replaceAll("'", '');

  return slug;
}

/**
 * Increment the generated GitHub name to find a unique one
 *
 * @param name Insight name to increment
 */
export function incrementInsightName(name: string): string {
  const regex = new RegExp('_([^_]\\d*)$');
  const res = regex.exec(name);
  if (res && res.length > 1) {
    const number = res[1];
    const increment = Number.parseInt(number) + 1;
    logger.debug(`Increment Insight Name by: ${increment}`);
    return name.replace(/\d+$/, increment.toString());
  }
  return name + '_1';
}
