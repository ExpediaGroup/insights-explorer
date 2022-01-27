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

import type { InsightLink } from '../models/generated/graphql';

/**
 * Group links into sections, with a default section of `Links.
 *
 * Maintains the order of groups, and links within groups.
 *
 * @param insightLinks List of links
 * @returns Links grouped by `group` property
 */
export const groupInsightLinks = (insightLinks?: InsightLink[]) => {
  return (insightLinks ?? []).reduce<{ group: string; links: { url: string; name?: string }[] }[]>(
    (acc, { url, name, group }) => {
      if (group == null || group.length === 0) {
        group = 'Links';
      }

      const groupArray = acc.find(({ group: groupName }) => groupName === group);

      if (groupArray) {
        groupArray.links.push({ url, name });
      } else {
        acc.push({ group, links: [{ url, name }] });
      }

      return acc;
    },
    []
  );
};
