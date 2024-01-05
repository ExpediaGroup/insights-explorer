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

import { DateTime } from 'luxon';
import { describe, expect, test } from 'vitest';

import { formatDateIntl } from './date-utils';

describe('date-utils', () => {
  describe('formatDateIntl', () => {
    const dateString = DateTime.local(2020, 9, 30).toISO();
    test('format with current locale', () => {
      const actual = formatDateIntl(dateString, DateTime.DATE_MED);
      expect(actual).toBe('Sep 30, 2020');
    });
    test('format with fr locale', () => {
      const actual = formatDateIntl(dateString, DateTime.DATE_MED, 'fr');
      expect(actual).toBe('30 sept. 2020');
    });
    test('format with current locale and custom format', () => {
      const actual = formatDateIntl(dateString, 'MMM yyyy');
      expect(actual).toBe('Sep 2020');
    });
    test('format with fr locale and custom format', () => {
      const actual = formatDateIntl(dateString, 'MMM yyyy', 'fr');
      expect(actual).toBe('sept. 2020');
    });
  });
});
