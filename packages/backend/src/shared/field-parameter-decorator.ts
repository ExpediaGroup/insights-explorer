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

import { FieldsByTypeName, parseResolveInfo } from 'graphql-parse-resolve-info';
import { createParamDecorator } from 'type-graphql';

// Source: https://github.com/MichalLytek/type-graphql/issues/10
export function Fields(): ParameterDecorator {
  return createParamDecorator(({ info }): FieldsByTypeName => {
    const parsedResolveInfoFragment = parseResolveInfo(info);

    if (!parsedResolveInfoFragment) {
      throw new Error('Failed to parse resolve info.');
    }

    return parsedResolveInfoFragment.fieldsByTypeName as FieldsByTypeName;
  });
}
