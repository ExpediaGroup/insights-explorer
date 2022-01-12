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

import { visit } from 'unist-util-visit';

const REGEX_IEX = /:iex:/g;

/**
 * Remark plugin specifically for replacing `:iex:` in text nodes with
 * the IEX logo image.
 *
 * It provides the same user experience as react-emoji, but with this singular purpose.
 *
 */
export const remarkIexLogo = (options) => {
  return function transformer(tree) {
    visit(tree, 'text', (node: any, index, parent) => {
      // Text node may contain zero or more :iex: shortcodes
      // Split by the shortcode to extract each piece of surrounding text
      const parts = node.value.split(REGEX_IEX);
      if (parts.length > 1 && parent) {
        // Map each text fragment into its own text node
        const newParts: any[] = parts.map((part) => ({ type: 'text', value: part }));

        // Use a reducer to interlace surrounding text nodes with IEX logo image nodes
        const newChildren = newParts.reduce((acc, part, i) => {
          if (i > 0) {
            acc.push({
              type: 'image',
              url: `${window.location.origin}/assets/iex-logo.svg`,
              data: {
                hProperties: {
                  alt: 'IEX logo',
                  display: 'inline-block',
                  height: '1em',
                  width: '1em',
                  verticalAlign: '-0.1em'
                }
              }
            });
          }
          acc.push(part);
          return acc;
        }, []);

        // Replace the existing text node with the new set of nodes
        parent.children.splice(index, 1, ...newChildren);
        return [visit.SKIP, index];
      }
    });
  };
};
