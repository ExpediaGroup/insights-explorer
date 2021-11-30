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

import visit from 'unist-util-visit';

import { hashCode } from '../hash';

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
      case 'badge':
        node.type = 'badge';
        break;
      case 'image': {
        node.type = 'image';
        node.url = node.children[0]?.value ?? node.children[0]?.url;
        delete node.children;

        const { height: h, width: w, ...attributes } = node.attributes;

        node.attributes = {
          w,
          h,
          ...attributes
        };

        break;
      }
      case 'video': {
        node.type = 'video';
        node.url = node.children[0]?.value ?? node.children[0]?.url;
        delete node.children;

        const { autoplay, loop, ...attributes } = node.attributes;

        node.attributes = {
          // Convert from string to boolean
          autoPlay: autoplay === 'true',
          loop: loop === 'true',
          ...attributes
        };

        break;
      }
      case 'katex':
        node.type = 'inlineMath';
        node.value = remarkNodetoText(node);
        break;
    }
  }

  function leafDirectives(node) {
    switch (node.name) {
      case 'insight':
        node.type = 'insight';
        if (node.children.length > 0) {
          node.fullName = node.children[0].value;
        }
        break;
      case 'insights':
        node.type = 'insights';
        if (node.children.length > 0) {
          node.query = node.children[0].value;
        }
        break;
    }
  }

  function containerDirectives(node) {
    switch (node.name) {
      case 'custom_table': {
        node.type = 'customTable';

        const { width, variant, size, colorScheme, ...attributes } = node.attributes;

        // First child represents the bracket contents
        // and should have `directiveLabel` set
        // e.g. :::custom_table[no-border]
        // Parse out the contents and remove that child
        if (node.children && node.children.length > 0) {
          if (node.children[0].data?.directiveLabel === true) {
            node.border = remarkNodetoText(node.children[0]);
            node.width = width || 'fit-content';
            node.children.shift();
          }
        }

        if (node.children[0] && node.children[0]?.type === 'table') {
          // Set default attributes if there's no matching incoming attribute
          node.children[0].attributes = {
            variant: variant || 'striped',
            size: size || 'sm',
            colorScheme: colorScheme || 'gray',
            ...attributes
          };
        }
        break;
      }
      case 'katex':
        node.type = 'math';
        node.value = remarkNodetoText(node);
        break;
      case 'vega': {
        node.type = 'vegaChart';

        // Extract body of node into text
        node.config = remarkNodetoText(node);

        // Manually calculate the key to avoid costly redraws
        // when this node isn't modified
        node.key = hashCode(node.config);

        // Convert height/width if available
        const { height: h, width: w, ...attributes } = node.attributes;
        node.attributes = {
          w,
          h,
          ...attributes
        };

        delete node.children;

        break;
      }
      case 'xkcd': {
        //console.log(node);
        node.type = 'xkcdChart';

        // First child represents the bracket contents
        // and should have `directiveLabel` set
        // e.g. :::xkcd[type]
        // Parse out the contents and remove that child
        if (node.children && node.children.length > 0) {
          if (node.children[0].data?.directiveLabel === true) {
            node.xkcdType = remarkNodetoText(node.children[0]);
            node.children.shift();
          }
        }

        // Extract body of node into text
        node.config = remarkNodetoText(node);

        // Manually calculate the key to avoid costly redraws
        // when this node isn't modified
        node.key = hashCode(node.config);

        // Convert height/width if available
        const { height: h, width: w, ...attributes } = node.attributes;
        node.attributes = {
          w,
          h,
          ...attributes
        };

        delete node.children;

        break;
      }
    }
  }

  return transform;
};
