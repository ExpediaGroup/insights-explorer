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

import { IndexedInsightConfig } from '@iex/models/indexed/indexed-insight-config';
import GraphQLJSON from 'graphql-type-json';
import { Field, ObjectType, InputType, ID } from 'type-graphql';

import { BaseModel } from './base-model';
import { Insight, UpdatedInsight } from './insight';
import { User } from './user';

export type DraftKey = string;

export type DraftData = Partial<Insight> & { commitMessage?: string };

export type DraftDataInput = Partial<UpdatedInsight> & {
  commitMessage?: string;
  initializedTemplate?: boolean;
} & IndexedInsightConfig;

@ObjectType()
export class Draft extends BaseModel {
  static get tableName(): string {
    return 'draft';
  }

  static get idColumn(): string {
    return 'draftId';
  }

  @Field()
  draftId!: number;

  @Field()
  draftKey!: DraftKey;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field({ nullable: true })
  insight?: Insight;

  @Field({ nullable: true })
  createdByUser?: User;

  @Field(() => GraphQLJSON)
  draftData!: DraftDataInput;

  /**
   * User who created this particular draft.
   *
   * This should only be null in scenarios where a draft was created automatically, e.g. by importing.
   */
  createdByUserId?: number;

  insightId?: number;
}

@InputType()
export class DraftInput {
  @Field()
  draftKey!: DraftKey;

  @Field(() => GraphQLJSON)
  draftData!: DraftDataInput;

  @Field(() => ID, { nullable: true })
  insightId?: string;
}
