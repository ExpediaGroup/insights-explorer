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

import { RepositoryType } from '@iex/models/repository-type';
import { getLogger } from '@iex/shared/logger';
import pMap from 'p-map';
import { Resolver, Mutation, Authorized } from 'type-graphql';
import { Service } from 'typedi';

import { syncInsight } from '../lib/backends/sync';
import { DbInsight } from '../models/insight';
import { Permission } from '../models/permission';
import { User } from '../models/user';
import { UserService } from '../services/user.service';

const logger = getLogger('admin.resolver');

@Service()
@Resolver()
export class AdminResolver {
  constructor(private readonly userService: UserService) {}

  @Authorized<Permission>({ user: true, admin: true })
  @Mutation(() => Number)
  async syncAllInsights(): Promise<number> {
    logger.warn('Syncing All Insights');

    const dbInsights = await DbInsight.query();

    await pMap(
      dbInsights,
      async (dbInsight) => {
        try {
          await syncInsight({
            repositoryType: RepositoryType.GITHUB,
            ...dbInsight.repositoryData
          });
          return null;
        } catch (error: any) {
          logger.error(`Error syncing Insight: ${dbInsight.insightId}`);
          logger.error(error.message);
          logger.error(JSON.stringify(error, null, 2));
          return error;
        }
      },
      { concurrency: 2 }
    );

    return dbInsights.length;
  }

  @Authorized<Permission>({ user: true, admin: true })
  @Mutation(() => Number)
  async syncAllUsers(): Promise<number> {
    logger.warn('Syncing All Users');

    const users = await User.query();

    await pMap(
      users,
      async (user) => {
        try {
          await this.userService.syncGitHubProfile(user);
          return null;
        } catch (error: any) {
          logger.error(`Error syncing user: ${user.userId}`);
          logger.error(error.message);
          logger.error(JSON.stringify(error, null, 2));
          return error;
        }
      },
      { concurrency: 5 }
    );

    return users.length;
  }
}
