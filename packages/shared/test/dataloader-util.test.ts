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

import { describe, expect, test } from 'vitest';

import { sort } from '../src/dataloader-util';

describe('dataloader-util', () => {
  describe('sort', () => {
    test('sort the data based on id field by default using number keys', () => {
      const keys = [1, 2, 3];
      const data = [
        { id: 3, value: 'three' },
        { id: 1, value: 'one' },
        { id: 2, value: 'two' }
      ];
      const sortedData = [
        { id: 1, value: 'one' },
        { id: 2, value: 'two' },
        { id: 3, value: 'three' }
      ];

      const result = sort(keys, data);

      expect(sortedData).toMatchObject(result);
    });

    test('be able to handle keys which are strings', () => {
      const keys = ['1', '2', '3'];
      const data = [
        { id: '3', value: 'three' },
        { id: '1', value: 'one' },
        { id: '2', value: 'two' }
      ];
      const sortedData = [
        { id: '1', value: 'one' },
        { id: '2', value: 'two' },
        { id: '3', value: 'three' }
      ];

      const result = sort(keys, data);

      expect(sortedData).toMatchObject(result);
    });

    test('be able to handle repeated keys', () => {
      const keys = [1, 1, 2, 3];
      const data = [
        { id: 3, value: 'three' },
        { id: 1, value: 'one' },
        { id: 2, value: 'two' }
      ];
      const sortedData = [
        { id: 1, value: 'one' },
        { id: 1, value: 'one' },
        { id: 2, value: 'two' },
        { id: 3, value: 'three' }
      ];

      const result = sort(keys, data);

      expect(sortedData).toMatchObject(result);
    });

    test('sort the data based on the the provided field', () => {
      const keys = [1, 2, 3];
      const data = [
        { other: 3, value: 'three' },
        { other: 1, value: 'one' },
        { other: 2, value: 'two' }
      ];
      const sortedData = [
        { other: 1, value: 'one' },
        { other: 2, value: 'two' },
        { other: 3, value: 'three' }
      ];

      const result = sort(keys, data, 'other');

      expect(sortedData).toMatchObject(result);
    });

    test('sort and match based on object keys', () => {
      const keys = [
        { userId: 1, messageId: 3 },
        { userId: 2, messageId: 4 },
        { userId: 3, messageId: 9 },
        { userId: 3, messageId: 7 },
        { userId: 1, messageId: 2 }
      ];

      const data = [
        { userId: 1, messageId: 2, value: 'yayy' },
        { userId: 3, messageId: 7, value: 'ya' },
        { userId: 1, messageId: 3, value: 'woot' },
        { userId: 2, messageId: 4, value: 'blue' },
        { userId: 3, messageId: 9, value: 'green' }
      ];

      const sortedData = [
        { userId: 1, messageId: 3, value: 'woot' },
        { userId: 2, messageId: 4, value: 'blue' },
        { userId: 3, messageId: 9, value: 'green' },
        { userId: 3, messageId: 7, value: 'ya' },
        { userId: 1, messageId: 2, value: 'yayy' }
      ];

      const result = sort(keys, data);

      expect(sortedData).toMatchObject(result);
    });

    test('skip any null objects', () => {
      const keys = [1, 2, 3];
      const data = [{ id: 1, value: 'one' }, null, { id: 3, value: 'three' }];
      const sortedData = [{ id: 1, value: 'one' }, null, { id: 3, value: 'three' }];

      const result = sort(keys, data);

      expect(sortedData).toMatchObject(result);
    });

    test("return null for any keys which don't have matching data 2", () => {
      const keys = [1, 2, 3];
      const data = [
        { id: 3, value: 'three' },
        { id: 1, value: 'one' }
      ];
      const sortedData = [{ id: 1, value: 'one' }, null, { id: 3, value: 'three' }];

      const result = sort(keys, data);

      expect(sortedData).toMatchObject(result);
    });

    test('return null for all if data is empty', () => {
      const keys = [1, 2, 3];
      const data: any[] = [];
      const sortedData = [null, null, null];

      const result = sort(keys, data);

      expect(sortedData).toMatchObject(result);
    });

    test('return empty array if keys is empty', () => {
      const keys: any[] = [];
      const data = [{ id: 1 }];
      const sortedData: any[] = [];

      const result = sort(keys, data);

      expect(sortedData).toMatchObject(result);
    });

    test('throw an error if multiple results match a single key', () => {
      const keys = [1, 2, 3];
      const data = [
        { id: 1, value: 'three' },
        { id: 1, value: 'one' },
        { id: 2, value: 'two' }
      ];

      expect(() => sort(keys, data)).toThrowError(/Multiple options in data matching key 1/);
    });
  });
});
