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

import type { Insight } from '../models/generated/graphql';

import { hashCode } from './hash';
import { getRandomInt } from './random';

export const getInsightGradient = (insight: Insight): string => {
  let i: number;

  // Use a separate gradient color set for Pages
  if (insight.itemType === 'page') {
    i = insight.id === undefined ? getRandomInt(12, 15) : (hashCode(insight.id) % 5) + 11;
  } else {
    i = insight.id === undefined ? getRandomInt(7, 11) : (hashCode(insight.id) % 4) + 7;
  }

  return `linear(to-tr, nord${i}.100 0%, nord${i}.400 100%)`;
};
