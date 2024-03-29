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

import { generateKey, encrypt, decrypt } from '../../src/shared/crypto';

describe('crypto', () => {
  const key = generateKey();

  describe('encrypt/decrypt', () => {
    test('Small value', () => {
      const secretValue = 'nuclear_codes';
      const buffer: Buffer = encrypt(secretValue, key);
      const decryptedValue = decrypt(buffer, key);

      expect(decryptedValue).toBe(secretValue);
    });
  });
});
