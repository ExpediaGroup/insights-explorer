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

import { parseAttributes } from './generic-attrs';

describe('generic-attrs', () => {
  describe('parseAttributes', () => {
    test('key=value', () => {
      const actual = parseAttributes('key=value');
      expect(actual).toEqual([{ key: 'key', value: 'value' }]);
    });
    test('key="value"', () => {
      const actual = parseAttributes('key="value"');
      expect(actual).toEqual([{ key: 'key', value: 'value' }]);
    });
    test('key', () => {
      const actual = parseAttributes('key');
      expect(actual).toEqual([{ key: 'key' }]);
    });
    test('file, collapse', () => {
      const actual = parseAttributes('file=/query.sql collapse');
      expect(actual).toEqual([{ key: 'file', value: '/query.sql' }, { key: 'collapse' }]);
    });
    test('file, lines, collapse', () => {
      const actual = parseAttributes('file=/query.sql lines=1..2;4..5 collapse');
      expect(actual).toEqual([
        { key: 'file', value: '/query.sql' },
        { key: 'lines', value: '1..2;4..5' },
        { key: 'collapse' }
      ]);
    });
    test('"file", lines, collapse', () => {
      const actual = parseAttributes('file="/query.sql" lines=1..2;4..5 collapse');
      expect(actual).toEqual([
        { key: 'file', value: '/query.sql' },
        { key: 'lines', value: '1..2;4..5' },
        { key: 'collapse' }
      ]);
    });
    test('"FILE", LINES, COLLAPSE', () => {
      const actual = parseAttributes('FILE="/query.sql" LINES=1..2;4..5 COLLAPSE');
      expect(actual).toEqual([
        { key: 'file', value: '/query.sql' },
        { key: 'lines', value: '1..2;4..5' },
        { key: 'collapse' }
      ]);
    });
  });
});
