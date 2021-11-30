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

import { secretbox, randomBytes } from 'tweetnacl';
import { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

const newNonce = (): Uint8Array => randomBytes(secretbox.nonceLength);

/**
 * Generates a suitable key for use with secretbox.
 */
export const generateKey = (): string => encodeBase64(randomBytes(secretbox.keyLength));

/**
 * Encrypts a string using a base-64 encoded key.
 */
export function encrypt(text: string, key = process.env.ENCRYPTION_KEY!): Buffer {
  if (text == null || text.length === 0) {
    return Buffer.from('');
  }

  const keyUint8Array = decodeBase64(key);
  const nonce = newNonce();

  const messageUint8 = decodeUTF8(text);
  const box = secretbox(messageUint8, nonce, keyUint8Array);

  const fullMessage = new Uint8Array(nonce.length + box.length);
  fullMessage.set(nonce);
  fullMessage.set(box, nonce.length);

  return Buffer.from(fullMessage.buffer);
}

/**
 * Decrypts a buffer using a base-64 encoded key.
 */
export function decrypt(messageWithNonce: Buffer, key = process.env.ENCRYPTION_KEY!): string {
  if (messageWithNonce == null || messageWithNonce.length === 0) {
    return '';
  }

  const keyUint8Array = decodeBase64(key);
  const messageWithNonceAsUint8Array = new Uint8Array(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(0, secretbox.nonceLength);
  const message = messageWithNonceAsUint8Array.slice(secretbox.nonceLength, messageWithNonce.length);

  const decrypted = secretbox.open(message, nonce, keyUint8Array);

  if (!decrypted) {
    throw new Error('Could not decrypt message');
  }

  return encodeUTF8(decrypted);
}
