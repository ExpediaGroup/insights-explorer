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

import { RequestParams } from '@elastic/elasticsearch';
import { GetResponse, SearchBody, SearchResponse } from '@iex/models/elasticsearch';
import { sort } from '@iex/shared/dataloader-util';
import { getLogger } from '@iex/shared/logger';
import { parseToElasticsearch, SearchMultiTerm, SearchRange, SearchTerm } from '@iex/shared/search';
import DataLoader from 'dataloader';
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';
import { raw } from 'objection';
import { Service } from 'typedi';

import { defaultElasticsearchClient, ElasticIndex } from '../lib/elasticsearch';
import { Activity, ActivityConnection, ActivityEdge, ActivityType, IndexedActivityDetails } from '../models/activity';
import { Sort } from '../models/connection';
import { User } from '../models/user';
import { UserActivity } from '../models/user-activity';
import { fromElasticsearchCursor, toElasticsearchCursor } from '../shared/resolver-utils';

const logger = getLogger('activity.service');
@Service()
export class ActivityService {
  private defaultSort: Sort = {
    field: 'occurredAt',
    direction: 'desc'
  };

  private userActivityLoader: DataLoader<{ activityId: string; userId: number }, UserActivity> = new DataLoader(
    async (tuples) => {
      logger.trace('userActivityLoader');

      const existingUserActivity = await UserActivity.query().whereInComposite(
        ['activityId', 'userId'],
        tuples.map(({ activityId, userId }) => [activityId, userId])
      );

      return sort(tuples, existingUserActivity);
    }
  );

  private likeCountLoader: DataLoader<string, number> = new DataLoader(async (activityIds) => {
    logger.trace('likeCountLoader');

    const result = await UserActivity.query()
      .whereIn('activityId', activityIds as string[])
      .where('liked', true)
      .groupBy('activityId')
      .count('* as likeCount')
      .select(['activityId']);

    return sort(activityIds, result, 'activityId').map((row) => row?.likeCount || 0);
  });

  private likedByLoader: DataLoader<string, number[]> = new DataLoader(async (activityIds) => {
    logger.trace('likedByLoader');

    const result = await UserActivity.query()
      .whereIn('activityId', activityIds as string[])
      .where('liked', true)
      .groupBy('activityId')
      .select(['activityId', raw('array_agg(user_id) as "user_ids"')]);

    return sort(activityIds, result, 'activityId').map((row) => row?.userIds || []);
  });

  constructor() {
    logger.trace('Constructing New Activity Service');
  }

  /**
   * Records a new Activity.
   *
   * @param activity Activity
   * @param user User
   */
  async recordActivity(
    activityType: ActivityType,
    user: User,
    details: IndexedActivityDetails
  ): Promise<void | string> {
    logger.debug(`Recording a ${activityType} activity`);
    const activityId = nanoid();

    const activity = {
      activityType,
      occurredAt: DateTime.now().toISO(),
      user: {
        displayName: user.displayName,
        email: user.email,
        userId: user.userId,
        userName: user.userName
      },
      details
    };

    await defaultElasticsearchClient
      .index({
        id: activityId,
        index: ElasticIndex.ACTIVITIES,
        body: activity
      })
      .then(() => {
        logger.trace(`Activity ${activityId} recorded!`);
      });

    return activityId;
  }

  /**
   * Fetch an activity by ID
   *
   * @param activityId Activity ID
   */
  async getActivity(activityId: string): Promise<Activity> {
    logger.debug(`Getting Activity with ID ${activityId}`);

    try {
      const result = await defaultElasticsearchClient.get<GetResponse<Activity>>({
        index: ElasticIndex.ACTIVITIES,
        id: activityId
      });

      if (result.body._source) {
        return { ...result.body._source, activityId: result.body._id } as Activity;
      } else {
        throw new Error(`Unable to retrieve Activity ${activityId}`);
      }
    } catch {
      throw new Error(`Unable to retrieve Activity ${activityId}`);
    }
  }

  /**
   * Fetches all Activities
   */
  async getActivities(search?: string, limit?: number, cursor?: string, sort?: Sort[]): Promise<ActivityConnection> {
    logger.trace('getActivities');

    const query: RequestParams.Search<SearchBody> = {
      index: ElasticIndex.ACTIVITIES,
      body: {
        size: limit ?? 20,
        query: {},
        aggregations: {
          users: {
            terms: {
              field: 'user.userName.keyword',
              size: 25
            }
          },
          insights: {
            terms: {
              field: 'details.insightName.keyword',
              size: 25
            }
          }
        }
      }
    };

    if (cursor) {
      query.body!.search_after = fromElasticsearchCursor(cursor);
    }

    // Parse search string into Elasticsearch query
    query.body!.query = parseToElasticsearch(search ?? '', (clauses) => {
      // This modifier function runs after parsing but before converting to Elasticsearch

      // If ActivityType isn't provided, default to {insight,page}
      const activityTypeClause = clauses.find(
        (clause) => (clause instanceof SearchTerm || clause instanceof SearchMultiTerm) && clause.key === 'activityType'
      );

      if (activityTypeClause === undefined) {
        clauses.push(
          new SearchMultiTerm('activityType', [
            ActivityType.CREATE_COMMENT,
            ActivityType.CREATE_INSIGHT,
            ActivityType.DELETE_COMMENT,
            ActivityType.DELETE_INSIGHT,
            ActivityType.EDIT_COMMENT,
            ActivityType.EDIT_INSIGHT,
            ActivityType.LIKE_COMMENT,
            ActivityType.LIKE_INSIGHT,
            ActivityType.UPDATE_PROFILE
          ])
        );
      }

      // Add additional range check to avoid future events
      clauses.push(new SearchRange('occurredAt', 'lt', 'now'));

      return clauses;
    });

    // If sort isn't provided, default to relevance
    if (sort == null || sort.length === 0) {
      sort = [{ field: 'relevance', direction: 'desc' }];
    }

    // Add occurredAt:desc as a secondary sort if it isn't already included
    if (!sort.some((i) => i.field === 'occurredAt')) {
      sort.push({ field: 'occurredAt', direction: 'desc' });
    }

    query.body!.sort = sort.map((i) => {
      const obj: any = {};
      obj[this.getSortField(i.field)] = { order: i.direction || this.defaultSort.direction! };
      return obj;
    });

    const elasticResponse = await defaultElasticsearchClient.search<SearchResponse<Activity>, SearchBody>(query);

    //  sort: [{ occurredAt: 'desc' }, { activityType: 'asc' }, { 'user.userId': 'asc' }],
    const edges: ActivityEdge[] = elasticResponse.body.hits.hits.map((doc) => {
      const activity = { ...doc._source, activityId: doc._id } as Activity;

      // Calculate cursor based on fields used in sort
      const cursor = toElasticsearchCursor(
        ...sort!.map((s) => {
          switch (s.field) {
            case 'occurredAt': {
              // Special date handling
              return new Date(activity.occurredAt).getTime();
            }
            case 'relevance': {
              return doc._score;
            }
          }
        })
      );

      return {
        node: activity,
        score: doc._score,
        cursor
      };
    });

    return {
      edges,
      pageInfo: {
        size: edges.length,
        total: elasticResponse.body.hits.total.value,
        startCursor: edges.length > 0 ? edges[0].cursor : undefined,
        endCursor: edges.length > 0 ? edges.at(-1)?.cursor : undefined,
        // Unable to determine this
        hasNextPage: true,
        // Backwards cursor isn't supported
        hasPreviousPage: false
      },
      suggestedFilters: {
        activityUsers: elasticResponse.body.aggregations.users.buckets.map(
          (bucket: { key: string; doc_count: number }) => {
            return {
              value: bucket.key,
              occurrences: bucket.doc_count
            };
          }
        ),
        activityInsights: elasticResponse.body.aggregations.insights.buckets.map(
          (bucket: { key: string; doc_count: number }) => {
            return {
              value: bucket.key,
              occurrences: bucket.doc_count
            };
          }
        )
      },
      internalRequest: query
    };
  }

  /**
   * Toggles liked from a user to an Activity.
   *
   * @param activityId Activity ID
   * @param liked Indicates whether liked is being added or removed
   * @param user User making the change
   */
  async likeActivity(activityId: string, liked: boolean, user: User): Promise<Activity> {
    const existingActivity = await this.getActivity(activityId);

    // Authorization check
    if (user.userId === existingActivity.user.userId) {
      throw new Error('You cannot like your own activities');
    }

    const existingUserActivity = await UserActivity.query()
      .where('activityId', activityId)
      .where('userId', user.userId)
      .first();

    await (existingUserActivity == null
      ? UserActivity.query().insert({
          activityId,
          userId: user.userId,
          liked
        })
      : existingUserActivity.$query().patchAndFetch({ liked }));

    // Inception?
    this.recordActivity(liked ? ActivityType.LIKE_ACTIVITY : ActivityType.UNLIKE_ACTIVITY, user, {
      activityId
    });

    return existingActivity;
  }

  /**
   * Returns whether a user likes an activity (or not)
   *
   * @param activityId News ID
   * @param user User
   */
  async doesUserLikeActivity(activityId: string, user: User): Promise<boolean> {
    logger.trace('doesUserLikeActivity ' + activityId);

    if (user == null) {
      return false;
    }

    const userNews = await this.userActivityLoader.load({ activityId, userId: user.userId });

    return userNews === null ? false : userNews.liked;
  }

  /**
   * Fetches total number of likes for an Activity.
   *
   * @param activityId News ID
   */
  async likeCount(activityId: string): Promise<number> {
    logger.trace('likeCount for ' + activityId);

    return this.likeCountLoader.load(activityId);
  }

  /**
   * Fetches list of user IDs who have liked an Activity
   *
   * @param activityId News ID
   */
  async likedBy(activityId: string): Promise<number[]> {
    logger.trace('likedBy for ' + activityId);

    return this.likedByLoader.load(activityId);
  }

  /**
   * Converts user-facing sort field names to the Elasticsearch field name.
   *
   * @param field User-facing field name
   */
  getSortField(field: string | undefined): string {
    switch (field) {
      case undefined: {
        return this.defaultSort.field!;
      }
      case 'relevance': {
        return '_score';
      }
      default: {
        return field;
      }
    }
  }
}
