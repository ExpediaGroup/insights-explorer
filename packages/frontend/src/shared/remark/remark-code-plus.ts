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

import { isAbsoluteUrl, urljoin } from '../url-utils';

import { KeyAttribute, KeyValueAttribute, parseAttributes } from './generic-attrs';

interface Props {
  baseUrl: string;
  transformAssetUri?: ((uri: string) => string) | null;
}

/**
 * Remark plugin that provides additional functionality to code blocks.
 *
 * Supported features:
 *  - Loading contents asynchronously from a URL
 *  - Optionally filtering the lines of a `file` code block
 *
 * Looks for code fences with `{ ... }` generic attributes, and parses the attributes.
 * This plugin only sets additional props on the node; it does NOT provide any
 * implementation for loading file contents.
 *
 * Optionally provide a baseUrl option to be concatenated with relative file paths.
 *
 * Works with or without a lang tag.
 */
export const remarkCodePlus = ({ baseUrl = '', transformAssetUri }: Props) => {
  return function transformer(tree, file) {
    visit(tree, 'code', (node: any, index, parent) => {
      node.data = {
        hName: 'code',
        hProperties: {}
      };

      // Parse out attributes (if any)
      const attrs = (node.meta || node.lang || '').match(/{(.*)}/);

      if (attrs !== null && attrs.length === 2) {
        const attributes = parseAttributes(attrs[1]);

        attributes.forEach((attribute) => {
          if (attribute instanceof KeyValueAttribute) {
            switch (attribute.key) {
              case 'file': {
                if (isAbsoluteUrl(attribute.value)) {
                  node.data.hProperties.uri = attribute.value;
                } else {
                  node.data.hProperties.uri = transformAssetUri
                    ? transformAssetUri(attribute.value)
                    : urljoin(baseUrl, attribute.value);
                }
                break;
              }

              case 'lines': {
                node.data.hProperties.lines = attribute.value;
                break;
              }
            }
          } else if (attribute instanceof KeyAttribute) {
            switch (attribute.key) {
              case 'collapse': {
                node.data.hProperties.collapse = 'true';
                break;
              }
            }
          }
        });
      }
    });
  };
};
