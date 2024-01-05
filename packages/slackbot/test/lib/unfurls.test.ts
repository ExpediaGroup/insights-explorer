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

import { matchInsightLink } from '../../src/lib/unfurls';

describe('unfurls', () => {
  describe('matchInsightLink', () => {
    test('match an Insight URL', () => {
      const match = matchInsightLink('https://iex/insight/namespace/name');
      expect(match).toMatchObject({
        namespace: 'namespace',
        name: 'name'
      });
    });
    test('match an Insight sub-URL', () => {
      const match = matchInsightLink('https://iex/insight/namespace/name/files/foo.png');
      expect(match).toMatchObject({
        namespace: 'namespace',
        name: 'name'
      });
    });
    test('not match other urls', () => {
      const match = matchInsightLink('https://iex');
      expect(match).toBeUndefined;
    });
  });
});
