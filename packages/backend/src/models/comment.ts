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

import { Connection, Edge, PageInfo } from '../models/connection';
import { toGlobalId } from '../shared/resolver-utils';

import { BaseModel } from './base-model';
import { Insight } from './insight';
import { User, UserConnection } from './user';

@ObjectType()
export class Comment extends BaseModel {
  static get tableName(): string {
    return 'comment';
  }

  static get idColumn(): string {
    return 'commentId';
  }

  @Field(() => ID)
  get id(): string {
    return toGlobalId('comment', this.commentId);
  }

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field({ nullable: true })
  deletedAt?: Date;

  @Field(() => Insight)
  insight!: Insight;

  @Field(() => User)
  author?: User;

  @Field()
  commentText!: string;

  @Field()
  isOwnComment!: boolean;

  @Field()
  isEdited!: boolean;

  @Field()
  get isDeleted(): boolean {
    return this.deletedAt != null;
  }

  @Field()
  likeCount!: number;

  @Field()
  viewerHasLiked!: boolean;

  @Field(() => UserConnection)
  likedBy!: UserConnection;

  commentId!: number;

  insightId!: number;

  authorId!: number;

  parentCommentId!: number;

  // TODO: Fix type
  childComments!: any;
}

@ObjectType()
export class CommentEdge implements Edge<Comment> {
  @Field()
  cursor!: string;

  @Field(() => Comment)
  node!: Comment;
}

@ObjectType()
export class CommentConnection implements Connection<Comment> {
  @Field(() => PageInfo, { nullable: true })
  pageInfo?: PageInfo;

  @Field(() => [CommentEdge])
  edges!: CommentEdge[];
}

@InputType()
export class CommentInput {
  @Field(() => ID, { nullable: true })
  insightId?: string;

  @Field()
  commentText!: string;

  @Field(() => ID, { nullable: true })
  parentCommentId?: string;
}
