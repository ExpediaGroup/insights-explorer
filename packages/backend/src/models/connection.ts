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

import { ArgsType, Field, InputType, ObjectType } from 'type-graphql';

export type ConnectionCursor = string;

export interface Edge<T> {
  cursor?: ConnectionCursor;
  score?: number;
  node: T;
}

export interface Connection<T> {
  pageInfo?: PageInfo;
  edges: Edge<T>[];
}

@InputType()
export class Sort {
  @Field({ nullable: true })
  field?: string;

  @Field({ nullable: true })
  direction?: 'asc' | 'desc';
}

@InputType()
export class Paging {
  @Field()
  size!: number;

  @Field({ nullable: true })
  from?: number;
}

@ObjectType()
export class PageInfo {
  @Field({ nullable: true })
  hasPreviousPage?: boolean;

  @Field({ nullable: true })
  hasNextPage?: boolean;

  @Field({ nullable: true })
  startCursor?: ConnectionCursor;

  @Field({ nullable: true })
  endCursor?: ConnectionCursor;

  @Field({ nullable: true })
  total?: number;

  @Field({ nullable: true })
  size?: number;

  // Custom implementation -- to deprecate
  @Field({ nullable: true })
  from?: number;
}

@ArgsType()
export class ConnectionArgs {
  @Field({ nullable: true, description: 'Paginate before opaque cursor' })
  before?: string;
  @Field({ nullable: true, description: 'Paginate after opaque cursor' })
  after?: string;
  @Field({ nullable: true, description: 'Paginate first' })
  first?: number;
  @Field({ nullable: true, description: 'Paginate last' })
  last?: number;

  @Field(() => [Sort], { nullable: true, description: 'Sort columns' })
  sort?: Sort[];
}
