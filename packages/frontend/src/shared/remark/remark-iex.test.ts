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

import { remarkIex } from './remark-iex';

describe('remark-iex', () => {
  describe('remarkIex', () => {
    test('badge tree', () => {
      const tree = {
        type: 'root',
        children: [
          {
            type: 'textDirective',
            name: 'badge',
            attributes: {
              colorScheme: 'gray'
            },
            children: [
              {
                type: 'text',
                value: 'IEX',
                position: {
                  start: {
                    line: 1,
                    column: 9,
                    offset: 8
                  },
                  end: {
                    line: 1,
                    column: 17,
                    offset: 16
                  }
                }
              }
            ],
            position: {
              start: {
                line: 1,
                column: 1,
                offset: 0
              },
              end: {
                line: 1,
                column: 38,
                offset: 37
              }
            }
          }
        ],
        position: {
          start: {
            line: 1,
            column: 1,
            offset: 0
          },
          end: {
            line: 1,
            column: 38,
            offset: 37
          }
        }
      };

      const expected = {
        type: 'root',
        children: [
          {
            type: 'badge',
            name: 'badge',
            attributes: {
              colorScheme: 'gray'
            },
            children: [
              {
                type: 'text',
                value: 'IEX',
                position: {
                  start: {
                    line: 1,
                    column: 9,
                    offset: 8
                  },
                  end: {
                    line: 1,
                    column: 17,
                    offset: 16
                  }
                }
              }
            ],
            position: {
              start: {
                line: 1,
                column: 1,
                offset: 0
              },
              end: {
                line: 1,
                column: 38,
                offset: 37
              }
            }
          }
        ],
        position: {
          start: {
            line: 1,
            column: 1,
            offset: 0
          },
          end: {
            line: 1,
            column: 38,
            offset: 37
          }
        }
      };

      // Tree is transformed in-place
      remarkIex({})(tree);
      expect(tree).toEqual(expected);
    });
  });
});
