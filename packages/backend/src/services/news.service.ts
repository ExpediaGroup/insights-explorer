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
import { News } from '../models/news';
import { User } from '../models/user';
import { UserNews } from '../models/user-news';

import { ActivityService } from './activity.service';

@Service()
export class NewsService {
  private userNewsLoader: DataLoader<{ newsId: number; userId: number }, UserNews> = new DataLoader(async (tuples) => {
    logger.silly('[NEWS.SERVICE] userNewsLoader');

    const existingUserNews = await UserNews.query().whereInComposite(
      ['newsId', 'userId'],
      tuples.map(({ newsId, userId }) => [newsId, userId])
    );

    return sort(tuples, existingUserNews);
  });

  private likeCountLoader: DataLoader<number, number> = new DataLoader(async (newsIds) => {
    logger.silly('[NEWS.SERVICE] likeCountLoader');

    const result = await UserNews.query()
      .whereIn('newsId', newsIds as number[])
      .where('liked', true)
      .groupBy('newsId')
      .count('* as likeCount')
      .select(['newsId']);

    return sort(newsIds, result, 'newsId').map((row) => row?.likeCount || 0);
  });

  private likedByLoader: DataLoader<number, number[]> = new DataLoader(async (newsIds) => {
    logger.silly('[NEWS.SERVICE] likedByLoader');

    const result = await UserNews.query()
      .whereIn('newsId', newsIds as number[])
      .where('liked', true)
      .groupBy('newsId')
      .select(['newsId', raw('array_agg(user_id) as "user_ids"')]);

    return sort(newsIds, result, 'newsId').map((row) => row?.userIds || []);
  });

  constructor(private readonly activityService: ActivityService) {
    logger.silly('[NEWS.SERVICE] Constructing New News Service');
  }

  /**
   * Fetch a news by ID
   *
   * @param newsId News ID
   */
  async getNews(newsId: number): Promise<News> {
    const existingNews = await News.query().where('newsId', newsId).first();

    if (existingNews === undefined) {
      throw new Error('News ID not found');
    }

    return existingNews;
  }

  /**
   * Returns whether a user likes a news item (or not)
   *
   * @param newsId News ID
   * @param user User
   */
  async doesUserLikeNews(newsId: number, user: User): Promise<boolean> {
    logger.silly('[NEWS.SERVICE] doesUserLikeNews ' + newsId);

    if (user == null) {
      return false;
    }

    const userNews = await this.userNewsLoader.load({ newsId, userId: user.userId });

    return userNews === null ? false : userNews.liked;
  }

  /**
   * Fetches total number of likes for a News item.
   *
   * @param newsId News ID
   */
  async likeCount(newsId: number): Promise<number> {
    logger.silly('[NEWS.SERVICE] likeCount for ' + newsId);

    return this.likeCountLoader.load(newsId);
  }

  /**
   * Fetches list of user IDs who have liked a News item
   *
   * @param newsId News ID
   */
  async likedBy(newsId: number): Promise<number[]> {
    logger.silly('[NEWS.SERVICE] likedBy for ' + newsId);

    return this.likedByLoader.load(newsId);
  }

  /**
   * Create a new News item.
   *
   * @param news News
   * @param user User making the change
   */
  async createNews(news: Partial<News>, user: User): Promise<News> {
    return await News.query()
      .insert({
        ...news,
        authorId: user.userId
      })
      .returning('*');
  }

  /**
   * Updates an existing News item.
   *
   * @param newsId News ID
   * @param news News
   */
  async updateNews(newsId: number, news: Partial<News>): Promise<News> {
    const existingNews = await this.getNews(newsId);

    return await existingNews.$query().patchAndFetch({
      ...news
    });
  }

  /**
   * Deletes a News item (soft).
   *
   * @param newsId News ID
   */
  async deleteNews(newsId: number): Promise<News> {
    const existingNews = await this.getNews(newsId);

    return await existingNews.$query().patchAndFetch({ deletedAt: News.knex().fn.now() });
  }

  /**
   * Toggles liked from a user to a News.
   *
   * @param newsId News ID
   * @param liked Indicates whether liked is being added or removed
   * @param user User making the change
   */
  async likeNews(newsId: number, liked: boolean, user: User): Promise<News> {
    const existingNews = await this.getNews(newsId);

    const existingUserNews = await UserNews.query().where('newsId', newsId).where('userId', user.userId).first();

    await (existingUserNews == null
      ? UserNews.query().insert({
          newsId,
          userId: user.userId,
          liked
        })
      : existingUserNews.$query().patchAndFetch({ liked }));

    this.activityService.recordActivity(liked ? ActivityType.LIKE_NEWS : ActivityType.UNLIKE_NEWS, user, {
      newsId
    });

    return existingNews;
  }

  /**
   * Fetches active News items
   */
  async activeNews(limit: number, offset: number, user?: User): Promise<News[]> {
    return this.news(true, limit, offset, user);
  }

  /**
   * Fetches all News items
   */
  async news(active = true, limit: number, offset: number, user?: User): Promise<News[]> {
    const select: any[] = [
      'news.*',
      UserNews.query().where('newsId', ref('news.newsId')).where('liked', true).count().as('likeCount')
    ];

    let query = News.query().where('deletedAt', null).limit(limit).offset(offset).orderBy('activeAt', 'desc');

    if (active === true) {
      query = query.where('activeAt', '<=', News.knex().fn.now());
    }

    if (user?.userId) {
      // Add join to return whether or not each news was liked by the user
      query = query.leftOuterJoin('user_news', (builder) =>
        builder
          .on('news.newsId', '=', 'user_news.newsId')
          .andOn('user_news.user_id', '=', defaultKnex.raw('?', user.userId))
      );

      select.push(raw('"user_news"."liked" is true as "viewer_has_liked"'));
    }

    query = query.select(select);

    const r = (await query) || [];
    return r;
  }
}
