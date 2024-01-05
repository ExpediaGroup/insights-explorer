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

import { filterContentByLines, parseLineFilter } from './lines';

describe('lines', () => {
  describe('parseLineFilter', () => {
    test('empty string', () => {
      expect(parseLineFilter('')).toEqual([]);
    });
    test('one range two lines', () => {
      expect(parseLineFilter('1..2')).toEqual([{ start: 0, end: 2 }]);
    });
    test('one range one line', () => {
      expect(parseLineFilter('1..1')).toEqual([{ start: 0, end: 1 }]);
    });
    test('one range one line (spaces)', () => {
      expect(parseLineFilter(' 1..1 ')).toEqual([{ start: 0, end: 1 }]);
    });
    test('one line', () => {
      expect(parseLineFilter('1')).toEqual([{ start: 0, end: 1 }]);
    });
    test('two lines', () => {
      expect(parseLineFilter('1,2')).toEqual([
        { start: 0, end: 1 },
        { start: 1, end: 2 }
      ]);
    });
    test('two lines (semicolon)', () => {
      expect(parseLineFilter('1;2')).toEqual([
        { start: 0, end: 1 },
        { start: 1, end: 2 }
      ]);
    });
    test('two ranges', () => {
      expect(parseLineFilter('1..4,10..20')).toEqual([
        { start: 0, end: 4 },
        { start: 9, end: 20 }
      ]);
    });
    test('two ranges (semicolon)', () => {
      expect(parseLineFilter('3..4;11..20')).toEqual([
        { start: 2, end: 4 },
        { start: 10, end: 20 }
      ]);
    });
    test('two ranges (semicolon, spaces)', () => {
      expect(parseLineFilter('3..4; 11..20')).toEqual([
        { start: 2, end: 4 },
        { start: 10, end: 20 }
      ]);
    });
    test('end of file', () => {
      expect(parseLineFilter('10..-1')).toEqual([{ start: 9, end: -1 }]);
    });
  });

  describe('filterContentByLines', () => {
    const content1 = `Line one
Line two
Line three
Line four
Line five
Line six
Line seven`;

    test('undefined filter', () => {
      expect(filterContentByLines(content1, undefined)).toEqual([content1, 1]);
    });
    test('empty string', () => {
      expect(filterContentByLines(content1, '')).toEqual([content1, 1]);
    });
    test('empty filter', () => {
      expect(filterContentByLines(content1, '')).toEqual([content1, 1]);
    });
    test('one line', () => {
      expect(filterContentByLines(content1, '1')).toEqual(['Line one', 1]);
    });
    test('two lines', () => {
      expect(filterContentByLines(content1, '1,2')).toEqual(['Line one\nLine two', 1]);
    });
    test('one range', () => {
      expect(filterContentByLines(content1, '1..2')).toEqual(['Line one\nLine two', 1]);
    });
    test('one range negative end', () => {
      expect(filterContentByLines(content1, '4..-2')).toEqual(['Line four\nLine five', 4]);
    });
    test('one range infinite end', () => {
      expect(filterContentByLines(content1, '4..')).toEqual(['Line four\nLine five\nLine six\nLine seven', 4]);
    });
    test('three numbers', () => {
      expect(filterContentByLines(content1, '1,3,5')).toEqual(['Line one\nLine three\nLine five', 1]);
    });
    test('two ranges', () => {
      expect(filterContentByLines(content1, '1..2,4,6..7')).toEqual([
        'Line one\nLine two\nLine four\nLine six\nLine seven',
        1
      ]);
    });
  });
});
