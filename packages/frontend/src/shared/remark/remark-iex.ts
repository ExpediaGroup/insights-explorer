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

import { remarkNodetoText } from './remark-util';

/**
 * Remark plugin for handling IEX directives.  It requires remark-directive for parsing.
 */
export const remarkIex = (options) => {
  function transform(tree) {
    visit(tree, ['textDirective'], textDirectives);
    visit(tree, ['leafDirective'], leafDirectives);
    visit(tree, ['containerDirective'], containerDirectives);
  }

  function textDirectives(node) {
    switch (node.name) {
      case 'badge': {
        node.data = {
          hName: 'badge',
          hProperties: node.attributes
        };
        break;
      }

      case 'image': {
        node.data = {
          hName: 'img',
          hProperties: {
            src: node.children[0]?.value ?? node.children[0]?.url,
            ...node.attributes
          }
        };

        delete node.children;
        break;
      }

      case 'video': {
        node.data = {
          hName: 'video',
          hProperties: {
            src: node.children[0]?.value ?? node.children[0]?.url,
            ...node.attributes
          }
        };

        delete node.children;
        break;
      }

      case 'katex': {
        node.data = {
          hName: 'katex',
          hProperties: {
            math: remarkNodetoText(node)
          }
        };

        break;
      }

      default: {
        node.data = {
          hName: 'textdirective',
          hProperties: node
        };
      }
    }
  }

  function leafDirectives(node) {
    switch (node.name) {
      case 'insight': {
        node.data = {
          hName: 'insight',
          hProperties: {
            ...node.attributes,
            fullName: remarkNodetoText(node)
          }
        };

        break;
      }

      case 'insights': {
        node.data = {
          hName: 'insights',
          hProperties: {
            query: remarkNodetoText(node),
            ...node.attributes
          }
        };

        break;
      }

      default: {
        node.data = {
          hName: 'leafdirective',
          hProperties: node
        };
      }
    }
  }

  function containerDirectives(node) {
    switch (node.name) {
      case 'table':
      case 'custom_table': {
        // Legacy support for older table directive
        if (node.name === 'custom_table') {
          // Apply previous defaults
          node.attributes = {
            variant: 'striped',
            ...node.attributes
          };
        }

        // First child represents the bracket contents
        // e.g. :::custom_table[no-border]
        // Parse out the contents and remove that child

        if (node.children && node.children.length > 0) {
          if (node.children[0] && node.children[0].data?.directiveLabel === true) {
            const border = remarkNodetoText(node.children[0]);

            // Legacy support for older table directive
            if (border === 'border' && node.attributes.border === undefined) {
              node.attributes.border = 'true';
            }

            // Remove directive label node
            node.children.shift();
          }

          if (node.children[0] && node.children[0].type === 'table') {
            // Apply attributes to nested table node
            // This directive node will not be rendered
            node.children[0].data = {
              hName: 'table',
              hProperties: node.attributes
            };
          }
        }

        break;
      }

      case 'katex': {
        node.data = {
          hName: 'katex',
          hProperties: {
            math: remarkNodetoText(node),
            block: 'true'
          }
        };

        break;
      }

      case 'vega': {
        node.data = {
          hName: 'vegachart',
          hProperties: {
            // Extract body of node into text
            config: remarkNodetoText(node),
            ...node.attributes
          }
        };

        delete node.children;

        break;
      }

      case 'xkcd': {
        let xkcdType = 'line';

        // First child represents the bracket contents
        // and should have `directiveLabel` set
        // e.g. :::xkcd[type]
        // Parse out the contents and remove that child
        if (node.children && node.children.length > 0) {
          if (node.children[0].data?.directiveLabel === true) {
            xkcdType = remarkNodetoText(node.children[0]);
            node.children.shift();
          }
        }

        node.data = {
          hName: 'xkcdchart',
          hProperties: {
            // Extract body of node into text
            config: remarkNodetoText(node),
            xkcdType,
            ...node.attributes
          }
        };

        delete node.children;

        break;
      }

      default: {
        node.data = {
          hName: 'containerdirective',
          hProperties: node
        };
      }
    }
  }

  return transform;
};
