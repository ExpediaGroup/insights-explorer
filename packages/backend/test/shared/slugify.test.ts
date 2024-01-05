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

import { slugifyInsightName, incrementInsightName } from '../../src/shared/slugify';

describe('slugify', () => {
  describe('slugifyInsightName', () => {
    test('Already slugified', () => {
      const slug = slugifyInsightName('amazing-insight');
      expect(slug).toBe('amazing-insight');
    });
    test('Already slugified 2', () => {
      const slug = slugifyInsightName('daves-amazing-insight-v-99');
      expect(slug).toBe('daves-amazing-insight-v-99');
    });
    test('Spaces', () => {
      const slug = slugifyInsightName('amazing insight');
      expect(slug).toBe('amazing-insight');
    });
    test('Trim Spaces', () => {
      const slug = slugifyInsightName(' amazing insight ');
      expect(slug).toBe('amazing-insight');
    });
    test('Capitals', () => {
      const slug = slugifyInsightName('AmazingInsight');
      expect(slug).toBe('amazing-insight');
    });
    test('Capitals and spaces', () => {
      const slug = slugifyInsightName('Amazing Insight');
      expect(slug).toBe('amazing-insight');
    });
    test('Diacritical marks', () => {
      const slug = slugifyInsightName('Déjà Vu Insight');
      expect(slug).toBe('deja-vu-insight');
    });
    test('Dashes', () => {
      const slug = slugifyInsightName('Max - Monday morning test');
      expect(slug).toBe('max-monday-morning-test');
    });
    test('Apostrophes', () => {
      const slug = slugifyInsightName("Dave's Amazing Insight");
      expect(slug).toBe('daves-amazing-insight');
    });
    test('Combo', () => {
      const slug = slugifyInsightName("Dave's AmazingInsight -- v99");
      expect(slug).toBe('daves-amazing-insight-v-99');
    });
  });

  describe('incrementInsightName', () => {
    test('first increment', () => {
      const incrementalName = incrementInsightName('test');
      expect(incrementalName).toBe('test_1');
    });
    test('first increment with underscore name', () => {
      const incrementalName = incrementInsightName('test_name');
      expect(incrementalName).toBe('test_name_1');
    });
    test('second increment', () => {
      const incrementalName = incrementInsightName('test_1');
      expect(incrementalName).toBe('test_2');
    });
    test('second increment with underscore name', () => {
      const incrementalName = incrementInsightName('test_name_1');
      expect(incrementalName).toBe('test_name_2');
    });
    test('two digit and three numbers increment', () => {
      const incrementalName = incrementInsightName('test_name_99');
      expect(incrementalName).toBe('test_name_100');
    });
    test('increment with underscore and numbers', () => {
      const incrementalName = incrementInsightName('test_10_1');
      expect(incrementalName).toBe('test_10_2');
    });
  });
});
