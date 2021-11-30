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

import { BaseModel } from './base-model';

export class UserComment extends BaseModel {
  static get tableName(): string {
    return 'userComment';
  }

  static get idColumn(): string[] {
    return ['userId', 'commentId'];
  }

  userId!: number;

  commentId!: number;

  createdAt!: Date;

  updatedAt!: Date;

  liked!: boolean;
}
