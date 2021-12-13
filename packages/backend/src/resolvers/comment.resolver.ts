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

import logger from '@iex/shared/logger';
import { Arg, Authorized, Ctx, FieldResolver, ID, Mutation, Query, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { Comment, CommentConnection, CommentInput } from '../models/comment';
import { Context } from '../models/context';
import { Insight } from '../models/insight';
import { Permission } from '../models/permission';
import { User, UserConnection } from '../models/user';
import { CommentService } from '../services/comment.service';
import { InsightService } from '../services/insight.service';
import { UserService } from '../services/user.service';
import { fromGlobalId, toCursor } from '../shared/resolver-utils';

@Service()
@Resolver(() => Comment)
export class CommentResolver {
  constructor(
    private readonly commentService: CommentService,
    private readonly insightService: InsightService,
    private readonly userService: UserService
  ) {}

  @Authorized<Permission>({ user: true })
  @Query(() => CommentConnection)
  async comments(@Arg('insightId', () => ID) insightId: string, @Ctx() ctx: Context): Promise<CommentConnection> {
    try {
      const [, dbInsightId] = fromGlobalId(insightId);
      const comments = await this.commentService.insightComments(dbInsightId, undefined, ctx?.user);

      return {
        edges: comments.map((c, i) => ({
          cursor: toCursor('Comment', i),
          node: c
        }))
      };
    } catch (error: any) {
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Query(() => Comment)
  async comment(@Arg('commentId', () => ID) commentId: string): Promise<Comment> {
    try {
      const [, dbCommentId] = fromGlobalId(commentId);
      return await this.commentService.getComment(dbCommentId);
    } catch (error: any) {
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @FieldResolver(() => User)
  async author(@Root() comment: Comment): Promise<User> {
    return this.userService.getUser(comment.authorId);
  }

  @FieldResolver(() => User)
  async insight(@Root() comment: Comment): Promise<Insight> {
    const insight = this.insightService.getInsight(comment.insightId);

    return insight as unknown as Insight;
  }

  @FieldResolver()
  isOwnComment(@Root() comment: Comment, @Ctx() ctx: Context): boolean {
    return comment.authorId === ctx?.user?.userId;
  }

  @FieldResolver()
  async likeCount(@Root() comment: Comment): Promise<number> {
    if (comment.likeCount != undefined) {
      // Already loaded, use the existing value
      return comment.likeCount;
    }

    return this.commentService.likeCount(comment.commentId);
  }

  @FieldResolver()
  async likedBy(@Root() comment: Comment): Promise<UserConnection> {
    if (comment.likeCount == 0) {
      return { edges: [] };
    }

    const userIds = await this.commentService.likedBy(comment.commentId);
    const users = await Promise.all(userIds.map((id) => this.userService.getUser(id)));

    return {
      edges: users.map((u, i) => ({
        cursor: toCursor('User', i),
        node: u
      }))
    };
  }

  @FieldResolver()
  async viewerHasLiked(@Root() comment: Comment, @Ctx() ctx: Context): Promise<boolean> {
    if (comment.viewerHasLiked != undefined) {
      // Already loaded, use the existing value
      return comment.viewerHasLiked;
    }

    return ctx.user ? this.commentService.doesUserLikeComment(comment.commentId, ctx.user) : false;
  }

  @FieldResolver(() => CommentConnection)
  async childComments(@Root() comment: Comment, @Ctx() ctx: Context): Promise<CommentConnection> {
    try {
      const comments = await this.commentService.insightComments(comment.insightId, comment.commentId, ctx?.user);

      return {
        edges: comments.map((c, i) => ({
          cursor: toCursor('Comment', i),
          node: c
        }))
      };
    } catch (error: any) {
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => Comment)
  async addComment(@Arg('comment') comment: CommentInput, @Ctx() ctx: Context): Promise<Comment> {
    logger.debug('[COMMENT.RESOLVER] Adding new Comment', comment);

    const { insightId, commentText, parentCommentId } = comment;
    const [, dbInsightId] = fromGlobalId(insightId!);

    const newComment: Partial<Comment> = {
      insightId: dbInsightId,
      commentText
    };

    if (parentCommentId) {
      // Deserialize
      const [, dbParentCommentId] = fromGlobalId(parentCommentId);
      newComment.parentCommentId = dbParentCommentId;
    }

    try {
      return await this.commentService.createComment(newComment, ctx.user!);
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => Comment)
  async updateComment(
    @Arg('commentId', () => ID) commentId: string,
    @Arg('comment') comment: CommentInput,
    @Ctx() ctx: Context
  ): Promise<Comment> {
    logger.debug('[COMMENT.RESOLVER] Updating Comment', comment);

    const [, dbCommentId] = fromGlobalId(commentId);
    const newComment: Partial<Comment> = {
      commentText: comment.commentText
    };

    try {
      return await this.commentService.updateComment(dbCommentId, newComment, ctx.user!);
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => Comment)
  async deleteComment(@Arg('commentId', () => ID) commentId: string, @Ctx() ctx: Context): Promise<Comment> {
    logger.debug('[COMMENT.RESOLVER] Deleting Comment', commentId);

    const [, dbCommentId] = fromGlobalId(commentId);

    try {
      return await this.commentService.deleteComment(dbCommentId, ctx.user!);
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => Comment)
  async likeComment(
    @Arg('commentId', () => ID) commentId: string,
    @Arg('liked') liked: boolean,
    @Ctx() ctx: Context
  ): Promise<Comment> {
    logger.debug('[COMMENT.RESOLVER] Toggling liked for Comment', commentId);

    const [, dbCommentId] = fromGlobalId(commentId);

    try {
      return await this.commentService.likeComment(dbCommentId, liked, ctx.user!);
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }
}
