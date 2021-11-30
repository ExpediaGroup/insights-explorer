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

import { Field, ID, InputType, ObjectType } from 'type-graphql';

import { BaseModel } from '../models/base-model';
import { Connection, Edge } from '../models/connection';
import { toGlobalId } from '../shared/resolver-utils';

import { PageInfo } from './connection';
import { User, UserConnection } from './user';

@ObjectType()
export class News extends BaseModel {
  static get tableName(): string {
    return 'news';
  }

  static get idColumn(): string {
    return 'newsId';
  }

  @Field(() => ID)
  get id(): string {
    return toGlobalId('news', this.newsId);
  }

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field()
  deletedAt!: Date;

  @Field()
  activeAt!: Date;

  @Field(() => User)
  author?: User;

  @Field()
  summary!: string;

  @Field()
  body!: string;

  @Field()
  get isDeleted(): boolean {
    return this.deletedAt != null;
  }

  @Field()
  get isActive(): boolean {
    return this.activeAt != null;
  }

  @Field()
  likeCount!: number;

  @Field()
  viewerHasLiked!: boolean;

  @Field(() => UserConnection)
  likedBy!: UserConnection;

  newsId!: number;

  authorId!: number;
}

@ObjectType()
export class NewsEdge implements Edge<News> {
  @Field()
  cursor!: string;

  @Field(() => News)
  node!: News;
}

@ObjectType()
export class NewsConnection implements Connection<News> {
  @Field(() => PageInfo, { nullable: true })
  pageInfo?: PageInfo;

  @Field(() => [NewsEdge])
  edges!: NewsEdge[];
}

@InputType()
export class NewsInput {
  @Field()
  activeAt!: Date;

  @Field()
  summary!: string;

  @Field()
  body!: string;
}
