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
import pMap from 'p-map';
import { Service } from 'typedi';

import { getCommitList } from '../lib/backends/github';
import { GitHubUser } from '../models/backends/github';
import { Insight, InsightChange } from '../models/insight';
import { User } from '../models/user';

import { UserService } from './user.service';

const logger = getLogger('change-history.service');

@Service()
export class ChangeHistoryService {
  constructor(private readonly userService: UserService) {
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
