/**
 * Copyright 2022 Expedia, Inc.
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

export function destring(value: string | Array<any> | Record<string, string>): any {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'object') {
    return destringObject(value);
  }

  const lowerValue = value.toLowerCase();
  if (lowerValue === 'null') {
    return null;
  }
  if (lowerValue === 'undefined') {
    return undefined;
  }
  if (lowerValue === 'true') {
    return true;
  }
  if (lowerValue === 'false') {
    return false;
  }
  if (lowerValue === 'nan') {
    return Number.NaN;
  }
  if (lowerValue === '-nan') {
    return -Number.NaN;
  }
  if (lowerValue === 'infinity') {
    return Number.POSITIVE_INFINITY;
  }
  if (lowerValue === '-infinity') {
    return Number.NEGATIVE_INFINITY;
  }
  if (lowerValue.startsWith('0x')) {
    return Number.parseInt(value, 16);
  }
  if (lowerValue.startsWith('0o')) {
    return Number.parseInt(value, 8);
  }
  if (lowerValue.startsWith('0b')) {
    return Number.parseInt(value, 2);
  }
  // try parse int
  if (/^-?\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  if (/^-?\d*\.\d+$/.test(value)) {
    return Number.parseFloat(value);
  }
  if (/^-?\d*\.\d*(e[+-]?\d+)?$/.test(value)) {
    return Number.parseFloat(value);
  }

  return value;
}

/**
 * Destringify the values of an object, e.g. convert "true" to true.
 * @param object Object
 */
export function destringObject(object: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, destring(value)]));
}
