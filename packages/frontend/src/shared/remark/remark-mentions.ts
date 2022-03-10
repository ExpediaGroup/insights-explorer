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

import { findAndReplace } from 'mdast-util-find-and-replace';

const mentionRegex = /@([A-Z0-9_]+)?/gi;

const replaceMention = (match: string, username: string): any => {
  return {
    type: 'user',
    data: {
      hName: 'user',
      hProperties: {
        username
      }
    },
    children: [
      {
        type: 'text',
        value: `@${username}`
      }
    ]
  };
};

/**
 * Remark plugin that replaces &commat;mentions with links to the user's profile.
 */
export const remarkMentions = () => {
  return (tree) => {
    findAndReplace(tree, mentionRegex, replaceMention, { ignore: ['link', 'linkReference'] });
  };
};
