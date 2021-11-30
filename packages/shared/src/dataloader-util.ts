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

type Datum = Record<string, any> | any;
type Key = number | string | Datum;

const getMapKey = (data: Datum, keyObject: Datum): string => {
  const filteredData: Datum = {};
  const keys = Object.keys(keyObject).sort();
  for (const key of keys) filteredData[key] = data[key];
  return JSON.stringify(filteredData);
};

/**
 * Sort function to ensure the correct data is returned for the matching keys.
 *
 * DataLoader expects batch functions to return an array of values the same length
 * as the array of keys, ordered to ensure each index aligns with the original keys.
 *
 * @param keys array of keys
 * @param data array of data
 * @param field key field in data; defaults to `id`
 */
export const sort = (keys: readonly Key[], data: Datum[], field = 'id'): (Datum | null)[] => {
  if (keys.length === 0) {
    return [];
  }
  if (data.length === 0) {
    // Return array same length as keys will all nulls
    return keys.map(() => null);
  }

  const map = data.reduce((accumulator: Datum, d: Datum | any) => {
    if (d == undefined) {
      return accumulator;
    }

    const mapKey = typeof keys[0] === 'object' ? getMapKey(d, keys[0]) : d[field];

    if (accumulator[mapKey]) {
      throw new Error(`Multiple options in data matching key ${String(mapKey)}`);
    }

    accumulator[mapKey] = d;

    return accumulator;
  }, {});

  return keys.map((key) => {
    const mapKey = typeof key === 'object' ? getMapKey(key, key) : key;
    return map[mapKey] || null;
  });
};
