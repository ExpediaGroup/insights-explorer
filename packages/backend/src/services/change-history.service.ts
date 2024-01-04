/**
 * Copyright 2022 Expedia, Inc.
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

import { getLogger } from '@iex/shared/logger';
import { ApolloError } from 'apollo-server-core';
import pMap from 'p-map';
import { Service } from 'typedi';

import { getCommitList, updateRepository, updateTopics } from '../lib/backends/github';
import { GitInstance } from '../lib/git-instance';
import { ActivityType } from '../models/activity';
import { GitHubUser } from '../models/backends/github';
import { Insight, InsightChange } from '../models/insight';
import { User } from '../models/user';

import { ActivityService } from './activity.service';
import { UserService } from './user.service';

const logger = getLogger('change-history.service');

@Service()
export class ChangeHistoryService {
  constructor(
    private readonly userService: UserService,
    private readonly activityService: ActivityService
  ) {
    logger.trace('Constructing New Change History Service');
  }

  /**
   * Fetches all Commit History from the given Insight
   * @param insight Insight
   * @returns Insight's Change History
   */
  async getChangeHistory(insight: Insight): Promise<InsightChange[]> {
    const commits = await getCommitList(insight.repository.owner.login, insight.repository.externalName);

    return await pMap(commits, async ({ node }): Promise<InsightChange> => {
      const author = await this.getUser(node.author.name, node.author.user);
      return { ...node, author };
    });
  }

  /**
   * Roll back an Insight to a specific change based on a given commit
   * @param gitHash commit hash to roll back to
   * @param user user who will commit changes
   * @param insight Insight on which to roll back
   */
  async rollBackToCommit(gitHash: string, user: User, insight: Insight): Promise<void> {
    const gitUrl = insight.repository.cloneUrl;
    const { githubPersonalAccessToken } = user;
    let insightYaml;
    try {
      insightYaml = await GitInstance.rollBackCommit(gitHash, gitUrl, user);

      this.activityService.recordActivity(ActivityType.EDIT_INSIGHT, user, {
        insightId: insight.insightId,
        insightName: insight.name
      });
    } catch (error: any) {
      logger.error(`Error while rolling back to commit ${gitHash}`, error);

      if (error.code === 'HttpError') {
        if (error.data.statusCode === 504) {
          throw new ApolloError(error.data.statusMessage, 'TIMEOUT_ERROR');
        }
        throw new ApolloError(error.data.response, 'GIT_PUSH_PERMISSION');
      } else if (error.caller === 'git.clone' && error.data.statusCode === 401) {
        throw new ApolloError(error.data.response, 'GIT_CLONE_PERMISSION');
      }

      throw error;
    }

    // GitHub API updates (Sync Insight repository and update metadata)
    logger.debug(`Updating GitHub repository (${insight.repository.externalId})`);
    try {
      if (insightYaml && insightYaml.description != null) {
        await updateRepository(githubPersonalAccessToken!, {
          repositoryId: insight.repository.externalId,
          description: insightYaml.description
        });
      }
      if (insightYaml && insightYaml.tags != null) {
        await updateTopics(githubPersonalAccessToken!, {
          repositoryId: insight.repository.externalId,
          topicNames: insightYaml.tags
        });
      }
    } catch (error: any) {
      // Eat any exceptions since keeping GitHub in sync is not required
      logger.error(`Unable to update GitHub repository: ${insight.repository.externalFullName}`);
      logger.error(JSON.stringify(error, null, 2));
    }
  }

  /**
   * Get user based on the Github author
   * @param name string
   * @param author GithubUser
   * @returns User
   */
  private async getUser(name: string, author: GitHubUser): Promise<User> {
    if (author === null) {
      return {
        userName: name || '',
        displayName: name || '',
        email: 'unknown'
      } as User;
    }

    const user = await this.userService.getUserByGitHubLogin(author.login);
    if (user === null) {
      // This means we detected a GitHub user who isn't an IEX user.
      // Make do with what we have
      return {
        userName: author.login || '',
        displayName: author.name || '',
        email: author.email || 'unknown'
      } as User;
    }

    return user;
  }
}
