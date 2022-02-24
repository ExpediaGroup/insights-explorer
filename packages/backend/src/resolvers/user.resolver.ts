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
import { Arg, Args, Authorized, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { ADMIN_GROUPS, userCache } from '../middleware/oauth-authenticator';
import { ActivityType } from '../models/activity';
import { ConnectionArgs } from '../models/connection';
import { Context } from '../models/context';
import { InsightConnection } from '../models/insight';
import { OAuthUserInfo } from '../models/oauth-user-info';
import { Permission } from '../models/permission';
import { User, UpdateUserInput } from '../models/user';
import { UserHealthCheck } from '../models/user-health-check';
import { ActivityService } from '../services/activity.service';
import { OAuthService } from '../services/oauth.service';
import { UserService } from '../services/user.service';

@Service()
@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly activityService: ActivityService,
    private readonly oauthService: OAuthService,
    private readonly userService: UserService
  ) {}

  @Authorized<Permission>({ user: true })
  @Query(() => User, { nullable: true })
  async user(@Arg('userName') userName: string, @Ctx() ctx: Context): Promise<User | null> {
    try {
      const user = await User.query().where('userName', userName.toLowerCase()).first();

      // Store this for authorization checks later
      ctx.retrievedUserId = user?.userId;

      return user;
    } catch (error: any) {
      logger.error(JSON.stringify(error, null, 2));
      return null;
    }
  }

  @Authorized<Permission>({ user: true })
  @Query(() => User)
  async currentUser(@Ctx() ctx: Context): Promise<User | undefined> {
    const { userName }: User = ctx.user!;
    try {
      const user = await User.query().where('userName', userName).first();

      // Store this for authorization checks later
      ctx.retrievedUserId = user?.userId;

      return user;
    } catch (error: any) {
      logger.error(JSON.stringify(error, null, 2));
      return undefined;
    }
  }

  @FieldResolver()
  isSelf(@Root() user: User, @Ctx() ctx: Context): boolean {
    if (ctx.user && ctx.user.userId == user.userId) {
      return true;
    }
    return false;
  }

  @FieldResolver()
  avatarUrl(@Root() user: User): string | undefined {
    if (user.avatar) {
      return `${process.env.PUBLIC_URL}/api/v1/avatars/${user.avatar}`;
    }
  }

  @FieldResolver()
  skills(@Root() user: User): string[] {
    return user.skills ?? [];
  }

  @Authorized<Permission>({ user: true })
  @FieldResolver()
  async healthCheck(@Root() user: User): Promise<UserHealthCheck> {
    return this.userService.healthCheck(user);
  }

  @FieldResolver()
  async authoredInsights(@Root() user: User, @Args() connectionArgs: ConnectionArgs): Promise<InsightConnection> {
    return this.userService.getAuthoredInsights(user, connectionArgs);
  }

  @FieldResolver()
  async likedInsights(@Root() user: User, @Args() connectionArgs: ConnectionArgs): Promise<InsightConnection> {
    return this.userService.getLikedInsights(user, connectionArgs);
  }

  @FieldResolver()
  async commentCount(@Root() user: User): Promise<number> {
    return this.userService.getCommentCount(user.userId);
  }

  // Does NOT require authorization
  @Mutation(() => String)
  async getAccessToken(@Ctx() ctx: Context, @Arg('code') code: string): Promise<string> {
    const accessToken = await this.oauthService.getAccessToken(code);

    return accessToken;
  }

  @Authorized<Permission>()
  @Mutation(() => User)
  async login(@Ctx() ctx: Context): Promise<User> {
    const userInfo: OAuthUserInfo = ctx.oAuthUserInfo!;

    // Upsert feature pending: https://github.com/knex/knex/pull/3763
    await User.knex().raw(
      `
      INSERT INTO "user" (user_name, email, display_name, last_login_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (email)
      DO UPDATE SET
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        last_login_at = EXCLUDED.last_login_at,
        login_count = "user".login_count + 1;
    `,
      [userInfo.username as any, userInfo.email, userInfo.name, User.knex().fn.now()]
    );

    const user =
      process.env.OAUTH_PROVIDER === 'okta'
        ? await User.query().where('email', userInfo.email!).first()
        : await User.query().where('user_name', userInfo.username).first();

    // Determine if user is an admin or not
    // TODO: This doesn't work with GitHub OAuth since we don't have groups
    user.isAdmin = userInfo?.groups?.some((group) => ADMIN_GROUPS.includes(group)) ?? false;

    logger.debug(`[LOGIN] ${user.userName} logged in...`);

    if (process.env.ACTIVITIES_IGNORE_LOGIN === 'false') {
      const { loginCount } = user;
      this.activityService.recordActivity(ActivityType.LOGIN, user, { loginCount, isFirstLogin: loginCount === 0 });
    }

    return user;
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => User)
  async updateUser(@Arg('user') updatedUser: UpdateUserInput, @Ctx() ctx: Context): Promise<User> {
    // This mutation always updates the current user (from the Authorization header)
    const { userId }: User = ctx.user!;

    // Store this for authorization checks later
    ctx.retrievedUserId = userId;

    const updated = await this.userService.updateUser(ctx.user!, updatedUser);

    // Delete from cache to avoid stale data
    userCache.del(ctx.token!);

    return updated;
  }
}
