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

import { Activity, ActivityConnection } from '../models/activity';
import { Sort } from '../models/connection';
import { Context } from '../models/context';
import { Insight } from '../models/insight';
import { Permission } from '../models/permission';
import { User, UserConnection } from '../models/user';
import { ActivityService } from '../services/activity.service';
import { InsightService } from '../services/insight.service';
import { UserService } from '../services/user.service';
import { toCursor } from '../shared/resolver-utils';

@Service()
@Resolver(() => Activity)
export class ActivityResolver {
  constructor(
    private readonly activityService: ActivityService,
    private readonly insightService: InsightService,
    private readonly userService: UserService
  ) {}

  @Authorized<Permission>({ user: true })
  @Query(() => ActivityConnection)
  async activities(
    @Arg('search', { nullable: true }) search?: string,
    @Arg('first', () => Number, { nullable: true }) first?: number,
    @Arg('after', { nullable: true }) after?: string,
    @Arg('sort', () => [Sort], { nullable: true }) sort?: Sort[]
  ): Promise<ActivityConnection> {
    try {
      return await this.activityService.getActivities(search, first, after, sort);
    } catch (error: any) {
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Query(() => Activity)
  async activity(@Arg('activityId', () => ID) activityId: string): Promise<Activity> {
    try {
      return await this.activityService.getActivity(activityId);
    } catch (error: any) {
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @FieldResolver(() => User)
  async user(@Root() activity: Activity): Promise<User> {
    return this.userService.getUser(activity.user.userId);
  }

  @FieldResolver(() => Insight, { nullable: true })
  async insight(@Root() activity: Activity): Promise<Insight | undefined> {
    if (activity.details && 'insightId' in activity.details) {
      return this.insightService.getInsight(activity.details.insightId) as unknown as Insight;
    }
  }

  @FieldResolver()
  async likeCount(@Root() activity: Activity): Promise<number> {
    if (activity.likeCount != undefined) {
      // Already loaded, use the existing value
      return activity.likeCount;
    }

    return this.activityService.likeCount(activity.activityId);
  }

  @FieldResolver()
  async likedBy(@Root() activity: Activity): Promise<UserConnection> {
    if (activity.likeCount == 0) {
      return { edges: [] };
    }

    const userIds = await this.activityService.likedBy(activity.activityId);
    const users = await Promise.all(userIds.map((id) => this.userService.getUser(id)));

    return {
      edges: users.map((u, i) => ({
        cursor: toCursor('User', i),
        node: u
      }))
    };
  }

  @FieldResolver()
  isOwnActivity(@Root() activity: Activity, @Ctx() ctx: Context): boolean {
    return activity.user.userId === ctx?.user?.userId;
  }

  @FieldResolver()
  async viewerHasLiked(@Root() activity: Activity, @Ctx() ctx: Context): Promise<boolean> {
    if (activity.viewerHasLiked != undefined) {
      // Already loaded, use the existing value
      return activity.viewerHasLiked;
    }

    return ctx.user ? this.activityService.doesUserLikeActivity(activity.activityId, ctx.user) : false;
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => Activity)
  async likeActivity(
    @Arg('activityId', () => ID) activityId: string,
    @Arg('liked') liked: boolean,
    @Ctx() ctx: Context
  ): Promise<Activity> {
    logger.debug('[ACTIVITY.RESOLVER] Toggling liked for Activity', activityId);

    try {
      const activity = await this.activityService.likeActivity(activityId, liked, ctx.user!);

      return activity;
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }
}
