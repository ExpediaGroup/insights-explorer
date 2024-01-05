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

import { destring } from './destring';

describe('destring', () => {
  test('empty string', () => {
    expect(destring('')).toEqual('');
  });
  test('undefined', () => {
    expect(destring('undefined')).toEqual(undefined);
  });
  test('null', () => {
    expect(destring('null')).toEqual(null);
  });
  test('string', () => {
    expect(destring('markdown')).toEqual('markdown');
  });
  test('false', () => {
    expect(destring('false')).toEqual(false);
  });
  test('true', () => {
    expect(destring('true')).toEqual(true);
  });
  test('FALSE', () => {
    expect(destring('FALSE')).toEqual(false);
  });
  test('TRUE', () => {
    expect(destring('TRUE')).toEqual(true);
  });
  test('0', () => {
    expect(destring('0')).toEqual(0);
  });
  test('1', () => {
    expect(destring('1')).toEqual(1);
  });
  test('0.5', () => {
    expect(destring('0.5')).toEqual(0.5);
  });
  test('1.0009', () => {
    expect(destring('1.0009')).toEqual(1.0009);
  });
  test('-2.45e10', () => {
    expect(destring('-2.45e10')).toEqual(-2.45e10);
  });
  test('-infinity', () => {
    expect(destring('-infinity')).toEqual(Number.NEGATIVE_INFINITY);
  });
  test('unstyled', () => {
    expect(destring('unstyled')).toEqual('unstyled');
  });
  test('object', () => {
    expect(
      destring({
        name: 'dave',
        enabled: 'true',
        count: '10'
      })
    ).toEqual({
      name: 'dave',
      enabled: true,
      count: 10
    });
  });
});
