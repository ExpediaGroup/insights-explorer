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

import { getLogger } from '@iex/shared/logger';
import { Authorized, FieldResolver, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { ElasticIndex, uniqueTerms } from '../lib/elasticsearch';
import { UniqueValue, AutocompleteResults } from '../models/autocomplete';
import { Permission } from '../models/permission';
import { UserService } from '../services/user.service';

const logger = getLogger('autocomplete.resolver');

@Service()
@Resolver(() => AutocompleteResults)
export class AutocompleteResolver {
  constructor(private readonly userService: UserService) {}

  @Authorized<Permission>({ user: true })
  @Query(() => AutocompleteResults)
  async autocomplete(): Promise<AutocompleteResults> {
    return {
      tags: [],
      authors: [],
      teams: [],
      skills: []
    };
  }

  @FieldResolver(() => [UniqueValue])
  async activityInsights(): Promise<UniqueValue[]> {
    try {
      return await uniqueTerms('details.insightName.keyword', undefined, ElasticIndex.ACTIVITIES);
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  @FieldResolver(() => [UniqueValue])
  async activityUsers(): Promise<UniqueValue[]> {
    try {
      return await uniqueTerms('user.userName.keyword', undefined, ElasticIndex.ACTIVITIES);
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  @FieldResolver(() => [UniqueValue])
  async tags(): Promise<UniqueValue[]> {
    try {
      return await uniqueTerms('tags.keyword');
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  @FieldResolver(() => [UniqueValue])
  async authors(): Promise<UniqueValue[]> {
    try {
      const authors = await uniqueTerms('contributors.userName.keyword');

      // Get the display name for each author
      return Promise.all(
        authors.map(async (author) => {
          const user = await this.userService.getUserByUserName(author.value);

          return {
            ...author,
            label: user?.displayName
          };
        })
      );
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  @FieldResolver(() => [UniqueValue])
  async skills(): Promise<UniqueValue[]> {
    try {
      return await this.userService.getUniqueSkills();
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  @FieldResolver(() => [UniqueValue])
  async teams(): Promise<UniqueValue[]> {
    try {
      const [publishedTeams, userTeams] = await Promise.all([
        uniqueTerms('metadata.team.keyword'),
        this.userService.getUniqueTeams()
      ]);

      // Combine both teams on Insights and Users
      const combined = [...publishedTeams, ...userTeams].reduce<Record<string, number>>((acc, v) => {
        acc[v.value] = acc[v.value] ? acc[v.value] + v.occurrences : v.occurrences;
        return acc;
      }, {});

      return Object.keys(combined).map<UniqueValue>((value) => ({ value, occurrences: combined[value] }));
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }
}
