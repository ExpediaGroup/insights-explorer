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
import { getLogger } from '@iex/shared/logger';
import { ValidationError } from 'apollo-server-express';
import DataLoader from 'dataloader';
import { PartialModelObject, raw } from 'objection';
import { Service } from 'typedi';

import { getUser, getTokenMetadata, addUserToOrganization } from '../lib/backends/github';
import { defaultKnex } from '../lib/db';
import { getInsights, getInsightsByContributor } from '../lib/elasticsearch';
import { ActivityType } from '../models/activity';
import { UniqueValue } from '../models/autocomplete';
import { GitHubTokenMetadata } from '../models/backends/github';
import { Comment, CommentConnection } from '../models/comment';
import { ConnectionArgs } from '../models/connection';
import { Insight, InsightConnection } from '../models/insight';
import { UpdateUserInput, User, UserGitHubProfile } from '../models/user';
import { UserHealthCheck } from '../models/user-health-check';
import { UserInsight } from '../models/user-insight';
import { fromGlobalId, toCursor } from '../shared/resolver-utils';

import { ActivityService } from './activity.service';

const logger = getLogger('user.service');

@Service()
export class UserService {
  private userLoader: DataLoader<number, User> = new DataLoader(async (userIds) => {
    logger.trace('userLoader');
    const users = await User.query().whereIn('userId', userIds as number[]);

    return sort(userIds, users, 'userId');
  });

  private usernameLoader: DataLoader<string, User> = new DataLoader(async (usernames) => {
    logger.trace('usernameLoader');
    const users = await User.query().whereIn('userName', usernames as string[]);

    return sort(usernames, users, 'userName');
  });

  private commentCountLoader: DataLoader<number, number> = new DataLoader(async (userIds) => {
    logger.trace('commentCountLoader');

    const result = await Comment.query()
      .whereIn('authorId', userIds as number[])
      .innerJoin('insight', 'comment.insightId', 'insight.insightId')
      .whereNull('insight.deletedAt')
      .groupBy('authorId')
      .count('* as commentCount')
      .select(['authorId']);

    return sort(userIds, result, 'authorId').map((row) => row?.commentCount || 0);
  });

  private gitHubUserLoader: DataLoader<string, User> = new DataLoader(async (githubLogins) => {
    logger.trace('gitHubUserLoader');
    const users = await User.query()
      .select('user.*', raw("github_profile->>'login'").as('githubLogin'))
      .whereIn(raw("github_profile->>'login'"), githubLogins as string[]);

    return sort(githubLogins, users, 'githubLogin');
  });

  constructor(private readonly activityService: ActivityService) {
    logger.trace('Constructing New User Service');
  }

  /**
   * Fetches a User by ID.
   *
   * @param userId User Id
   */
  async getUser(userId: number): Promise<User> {
    return this.userLoader.load(userId);
  }

  /**
   * Fetches a User by username.
   *
   * @param username User name
   */
  async getUserByUserName(username: string): Promise<User> {
    return this.usernameLoader.load(username);
  }

  /**
   * Fetches a User by GitHub login.
   *
   * @param githubLogin GitHub user login
   */
  async getUserByGitHubLogin(githubLogin: string): Promise<User> {
    return this.gitHubUserLoader.load(githubLogin);
  }

  /**
   * Fetches a User by Email.
   *
   * @param email User email
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    return User.query().where('email', 'ILIKE', email).first();
  }

  /**
   * Provides several "health checks" for a user's configuration
   */
  async healthCheck(user: User): Promise<UserHealthCheck> {
    logger.debug(`Executing health check for ${user.displayName}`);
    const healthCheck = new UserHealthCheck();

    if (user.githubPersonalAccessToken != null && user.githubPersonalAccessToken.length > 0) {
      healthCheck.hasGitHubToken = true;

      let metadata: GitHubTokenMetadata | undefined;
      try {
        metadata = await getTokenMetadata(user.githubPersonalAccessToken);
        healthCheck.isGitHubTokenValid = true;
      } catch {
        healthCheck.isGitHubTokenValid = false;
      }

      if (metadata) {
        const gitHubUser = await getUser(metadata.login);

        if (gitHubUser.defaultOrg === null) {
          try {
            // User is not a member of the default org; add them automatically
            logger.warn(`Adding user ${metadata.login} to ${process.env.GITHUB_DEFAULT_ORG}`);
            await addUserToOrganization(
              process.env.GITHUB_ACCESS_TOKEN,
              process.env.GITHUB_DEFAULT_ORG,
              metadata.login
            );
            healthCheck.isDefaultOrgMember = true;
          } catch {
            healthCheck.isDefaultOrgMember = false;
          }
        } else {
          healthCheck.isDefaultOrgMember = true;
        }

        healthCheck.hasGitHubEmail = gitHubUser.email != null && gitHubUser.email.length > 0;
        healthCheck.doesGitHubEmailMatch = gitHubUser.email === user.email;

        healthCheck.hasRequiredScopes = metadata.scopes.includes('repo');
      }
    } else {
      healthCheck.hasGitHubToken = false;
    }
    return healthCheck;
  }

  async updateUser(user: User, updatedUser: UpdateUserInput): Promise<User> {
    // Validation
    if (updatedUser.userName !== undefined && !/^[\dA-Za-z]+$/.test(updatedUser.userName)) {
      throw new ValidationError('Field "userName" does not match the required pattern: "/^[A-Za-z0-9]+$/"');
    }

    const githubProfile = await this.getGitHubProfile(
      updatedUser.githubPersonalAccessToken || user.githubPersonalAccessToken
    );

    const userPatch: PartialModelObject<User> = {
      ...updatedUser,

      // Set the locale back to NULL if empty
      locale: updatedUser.locale == '' ? defaultKnex.raw('DEFAULT') : updatedUser.locale,

      githubProfile
    };

    switch (updatedUser.defaultTemplateId) {
      case '': {
        // Set the defaultTemplate back to NULL if empty
        userPatch.defaultTemplate = defaultKnex.raw('DEFAULT');
        break;
      }
      case undefined: {
        break;
      }
      default: {
        // Convert from global ID to database ID
        userPatch.defaultTemplate = fromGlobalId(updatedUser.defaultTemplateId)[1];
      }
    }

    const updated = await User.query().patchAndFetchById(user.userId, userPatch);

    if (updatedUser.bio) {
      this.activityService.recordActivity(ActivityType.UPDATE_PROFILE, user, {});
    }

    return updated;
  }

  /**
   * Syncs a user's GitHub profile (if they have a GitHub token provided).
   *
   * @param user User
   */
  async syncGitHubProfile(user: User): Promise<User> {
    if (user.githubPersonalAccessToken == null) {
      return user;
    }

    return this.updateUser(user, {});
  }

  /**
   * Retrieves information from the User's GitHub profile.
   */
  async getGitHubProfile(githubPersonalAccessToken?: string): Promise<UserGitHubProfile | undefined> {
    if (githubPersonalAccessToken === undefined) {
      return undefined;
    }

    try {
      logger.debug('Fetching GitHub Profile');
      const { login } = await getTokenMetadata(githubPersonalAccessToken);
      const { avatarUrl, url, bio, location, status } = await getUser(login);

      const githubProfile: UserGitHubProfile = {
        login,
        avatarUrl,
        url,
        bio,
        location,
        status
      };

      return githubProfile;
    } catch {
      logger.warn('Unable to get GitHub profile information');
    }
  }

  async getAuthoredInsights(
    user: User,
    connectionArgs: ConnectionArgs,
    _source?: string[]
  ): Promise<InsightConnection> {
    return getInsightsByContributor(user.email, connectionArgs, _source);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getLikedInsights(user: User, connectionArgs: ConnectionArgs, _source?: string[]): Promise<InsightConnection> {
    const likedUserInsights = await UserInsight.query()
      .where('userId', user.userId)
      .where('liked', true)
      .innerJoin('insight', 'userInsight.insightId', 'insight.insightId')
      .whereNull('insight.deletedAt')
      .orderBy('updatedAt', 'desc');

    const likedInsights = (await getInsights(
      likedUserInsights.map((i) => i.insightId),
      _source
    )) as unknown as Insight[];
    const currentLikedInsights = likedInsights.filter((i) => i !== null);

    return {
      pageInfo: {
        total: currentLikedInsights.length
      },
      edges: currentLikedInsights.map((insight) => ({ cursor: 'TODO', node: insight }))
    };
  }

  /**
   * Fetches a User's comment count by ID.
   *
   * @param userId User Id
   */
  async getCommentCount(userId: number): Promise<number> {
    return this.commentCountLoader.load(userId);
  }

  async getUniqueSkills(): Promise<UniqueValue[]> {
    const result = await User.query()
      .whereNotNull('skills')
      .select([raw('unnest(skills) as skill')])
      .groupBy('skill')
      .count('* as count')
      .orderBy('count', 'desc');

    return result.map((row: any) => ({ value: row.skill as string, occurrences: row.count }));
  }

  async getUniqueTeams(): Promise<UniqueValue[]> {
    const result = await User.query()
      .whereNotNull('team')
      .groupBy('team')
      .count('* as count')
      .select(['team'])
      .orderBy('count', 'desc');

    return result.map((row: any) => ({ value: row.team as string, occurrences: Number.parseInt(row.count) }));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUserComments(user: User, connectionArgs: ConnectionArgs): Promise<CommentConnection> {
    logger.trace('userComments');

    const userComments = await Comment.query()
      .where('authorId', user.userId)
      .innerJoin('insight', 'comment.insightId', 'insight.insightId')
      .whereNull('insight.deletedAt')
      .whereNull('comment.deletedAt')
      .orderBy('updatedAt', 'desc');

    return {
      pageInfo: {
        total: userComments.length
      },
      edges: userComments.map((comment, i) => ({ cursor: toCursor('Comment', i), node: comment as Comment }))
    } as CommentConnection;
  }
}
