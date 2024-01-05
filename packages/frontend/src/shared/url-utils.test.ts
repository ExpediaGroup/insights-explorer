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

import { isHashUrl } from './url-utils';

describe('url-utils', () => {
  describe('isHashUrl', () => {
    test('hash url', () => {
      expect(isHashUrl('#hash')).toBeTruthy();
    });
    test('not hash url', () => {
      expect(isHashUrl('/help')).toBeFalsy();
    });
    test('absolute with hash', () => {
      expect(isHashUrl('https://iex/help#markdown')).toBeFalsy();
    });
    test('relative with hash', () => {
      expect(isHashUrl('/help#markdown')).toBeFalsy();
    });
  });
});
