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

import { sort } from '@iex/shared/dataloader-util';
import logger from '@iex/shared/logger';
import DataLoader from 'dataloader';
import { raw, ref } from 'objection';
import { Service } from 'typedi';

import { defaultKnex } from '../lib/db';
import { ActivityType } from '../models/activity';
import { Comment } from '../models/comment';
import { User } from '../models/user';
import { UserComment } from '../models/user-comment';

import { ActivityService } from './activity.service';

@Service()
export class CommentService {
  private userCommentLoader: DataLoader<{ commentId: number; userId: number }, UserComment> = new DataLoader(
    async (tuples) => {
      logger.silly('[COMMENT.SERVICE] userCommentLoader');

      const existingUserComments = await UserComment.query().whereInComposite(
        ['commentId', 'userId'],
        tuples.map(({ commentId, userId }) => [commentId, userId])
      );

      return sort(tuples, existingUserComments);
    }
  );

  private likeCountLoader: DataLoader<number, number> = new DataLoader(async (commentIds) => {
    logger.silly('[COMMENT.SERVICE] likeCountLoader');

    const result = await UserComment.query()
      .whereIn('commentId', commentIds as number[])
      .where('liked', true)
      .groupBy('commentId')
      .count('* as likeCount')
      .select(['commentId']);

    return sort(commentIds, result, 'commentId').map((row) => row?.likeCount || 0);
  });

  private likedByLoader: DataLoader<number, number[]> = new DataLoader(async (commentIds) => {
    logger.silly('[COMMENT.SERVICE] likedByLoader');

    const result = await UserComment.query()
      .whereIn('commentId', commentIds as number[])
      .where('liked', true)
      .groupBy('commentId')
      .select(['commentId', raw('array_agg(user_id) as "user_ids"')]);

    return sort(commentIds, result, 'commentId').map((row) => row?.userIds || []);
  });

  constructor(private readonly activityService: ActivityService) {
    logger.silly('[COMMENT.SERVICE] Constructing New Comment Service');
  }

  /**
   * Fetch a comment by ID
   *
   * @param comment CommentId
   */
  async getComment(commentId: number): Promise<Comment> {
    const existingComment = await Comment.query().where('commentId', commentId).first();

    if (existingComment === undefined) {
      throw new Error('Comment ID not found');
    }

    return existingComment;
  }

  /**
   * Returns whether a user likes a comment (or not)
   *
   * @param commentId Comment ID
   * @param user User
   */
  async doesUserLikeComment(commentId: number, user: User): Promise<boolean> {
    logger.silly('[COMMENT.SERVICE] doesUserLikeComment ' + commentId);

    if (user == null) {
      return false;
    }

    const userComment = await this.userCommentLoader.load({ commentId, userId: user.userId });

    return userComment === null ? false : userComment.liked;
  }

  /**
   * Fetches total number of likes for a Comment.
   *
   * @param commentId Comment ID
   */
  async likeCount(commentId: number): Promise<number> {
    logger.silly('[COMMENT.SERVICE] likeCount for ' + commentId);

    return this.likeCountLoader.load(commentId);
  }

  /**
   * Fetches list of user IDs who have liked a Comment
   *
   * @param commentId Comment ID
   */
  async likedBy(commentId: number): Promise<number[]> {
    logger.silly('[COMMENT.SERVICE] likedBy for ' + commentId);

    return this.likedByLoader.load(commentId);
  }

  /**
   * Create a new Comment.
   *
   * @param comment Comment
   * @param user User making the change
   */
  async createComment(comment: Partial<Comment>, user: User): Promise<Comment> {
    const newComment = await Comment.query()
      .insert({
        ...comment,
        authorId: user.userId
      })
      .returning('*');

    const { commentId, commentText, insightId } = newComment;

    this.activityService.recordActivity(ActivityType.CREATE_COMMENT, user, {
      commentId,
      commentText,
      insightId
    });

    return newComment;
  }

  /**
   * Updates an existing comment.
   *
   * @param commentId Comment ID
   * @param comment Comment
   * @param user User making the change
   */
  async updateComment(commentId: number, comment: Partial<Comment>, user: User): Promise<Comment> {
    const existingComment = await this.getComment(commentId);

    // Authorization check
    if (user.userId !== existingComment.authorId) {
      throw new Error("Access denied! You don't have permission for this action!");
    }

    const updatedComment = await existingComment.$query().patchAndFetch({
      ...comment,
      isEdited: true
    });

    const { commentText, insightId } = updatedComment;

    this.activityService.recordActivity(ActivityType.EDIT_COMMENT, user, {
      commentId,
      commentText,
      insightId
    });

    return updatedComment;
  }

  /**
   * Deletes a comment (soft).
   *
   * @param commentId Comment ID
   * @param user User making the change
   */
  async deleteComment(commentId: number, user: User): Promise<Comment> {
    const existingComment = await this.getComment(commentId);

    // Authorization check
    if (user.userId !== existingComment.authorId) {
      throw new Error("Access denied! You don't have permission for this action!");
    }

    const deletedComment = await existingComment.$query().patchAndFetch({ deletedAt: Comment.knex().fn.now() });

    const { commentText, insightId } = deletedComment;

    this.activityService.recordActivity(ActivityType.DELETE_COMMENT, user, {
      commentId,
      commentText,
      insightId
    });

    return deletedComment;
  }

  /**
   * Toggles liked from a user to a comment.
   *
   * @param commentId Comment ID
   * @param liked Indicates whether liked is being added or removed
   * @param user User making the change
   */
  async likeComment(commentId: number, liked: boolean, user: User): Promise<Comment> {
    const existingComment = await this.getComment(commentId);

    // Authorization check
    if (user.userId === existingComment.authorId) {
      throw new Error('You cannot like your own posts');
    }

    const existingUserComment = await UserComment.query()
      .where('commentId', commentId)
      .where('userId', user.userId)
      .first();

    await (existingUserComment == null
      ? UserComment.query().insert({
          commentId,
          userId: user.userId,
          liked
        })
      : existingUserComment.$query().patchAndFetch({ liked }));

    const { commentText, insightId } = existingComment;

    this.activityService.recordActivity(liked ? ActivityType.LIKE_COMMENT : ActivityType.UNLIKE_COMMENT, user, {
      commentId,
      commentText,
      insightId
    });

    return existingComment;
  }

  /**
   * Fetches comments
   *
   * @param insightId Insight ID
   */
  async insightComments(insightId: number, parentCommentId?: number, user?: User): Promise<Comment[]> {
    const select: any[] = [
      'comment.*',
      UserComment.query()
        .where('insightId', insightId)
        .where('commentId', ref('comment.commentId'))
        .where('liked', true)
        .count()
        .as('likeCount')
    ];

    let query = Comment.query()
      .where('insightId', insightId)
      .where('deletedAt', null)
      .where('parentCommentId', parentCommentId == null ? null : parentCommentId)
      .orderBy('createdAt', 'asc');

    if (user?.userId) {
      // Add join to return whether or not each comment was liked by the user
      query = query.leftOuterJoin('user_comment', (builder) =>
        builder
          .on('comment.commentId', '=', 'user_comment.commentId')
          .andOn('user_comment.user_id', '=', defaultKnex.raw('?', user.userId))
      );

      select.push(raw('"user_comment"."liked" is true as "viewer_has_liked"'));
    }

    query = query.select(select);

    const r = (await query) || [];
    return r;
  }
}
