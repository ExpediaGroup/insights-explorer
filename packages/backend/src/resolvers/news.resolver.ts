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
import { Arg, Authorized, Ctx, FieldResolver, ID, Mutation, Query, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { Context } from '../models/context';
import { News, NewsConnection, NewsInput } from '../models/news';
import { Permission } from '../models/permission';
import { User, UserConnection } from '../models/user';
import { NewsService } from '../services/news.service';
import { UserService } from '../services/user.service';
import { fromCursor, fromGlobalId, toCursor } from '../shared/resolver-utils';

const logger = getLogger('news.resolver');

@Service()
@Resolver(() => News)
export class NewsResolver {
  constructor(
    private readonly newsService: NewsService,
    private readonly userService: UserService
  ) {}

  @Authorized<Permission>({ user: true })
  @Query(() => NewsConnection)
  async activeNews(
    @Arg('first', () => Number, { nullable: true }) first: number,
    @Arg('after', { nullable: true }) after: string,
    @Ctx() ctx: Context
  ): Promise<NewsConnection> {
    try {
      let offset = 0;

      if (after) {
        [, offset] = fromCursor(after);
      }

      const news = await this.newsService.activeNews(first || 20, offset, ctx?.user);

      return {
        edges: news.map((n, i) => ({
          cursor: toCursor('News', i),
          node: n
        }))
      };
    } catch (error: any) {
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Query(() => NewsConnection)
  async news(
    @Arg('first', () => Number, { nullable: true }) first: number,
    @Arg('after', { nullable: true }) after: string,
    @Arg('active', { nullable: true }) active: boolean,
    @Ctx() ctx: Context
  ): Promise<NewsConnection> {
    try {
      let offset = 0;

      if (after) {
        [, offset] = fromCursor(after);
      }

      // Defaults to all news, not just active news
      const news = await this.newsService.news(active ?? false, first ?? 20, offset, ctx?.user);

      return {
        edges: news.map((n, i) => ({
          cursor: toCursor('News', i),
          node: n
        }))
      };
    } catch (error: any) {
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Query(() => News)
  async newsById(@Arg('newsId', () => ID) newsId: string): Promise<News> {
    try {
      const [, dbNewsId] = fromGlobalId(newsId);
      return await this.newsService.getNews(dbNewsId);
    } catch (error: any) {
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @FieldResolver(() => User)
  async author(@Root() news: News): Promise<User> {
    return this.userService.getUser(news.authorId);
  }

  @FieldResolver()
  async likeCount(@Root() news: News): Promise<number> {
    if (news.likeCount != undefined) {
      // Already loaded, use the existing value
      return news.likeCount;
    }

    return this.newsService.likeCount(news.newsId);
  }

  @FieldResolver()
  async likedBy(@Root() news: News): Promise<UserConnection> {
    if (news.likeCount == 0) {
      return { edges: [] };
    }

    const userIds = await this.newsService.likedBy(news.newsId);
    const users = await Promise.all(userIds.map((id) => this.userService.getUser(id)));

    return {
      edges: users.map((u, i) => ({
        cursor: toCursor('User', i),
        node: u
      }))
    };
  }

  @FieldResolver()
  async viewerHasLiked(@Root() news: News, @Ctx() ctx: Context): Promise<boolean> {
    if (news.viewerHasLiked != undefined) {
      // Already loaded, use the existing value
      return news.viewerHasLiked;
    }

    return ctx.user ? this.newsService.doesUserLikeNews(news.newsId, ctx.user) : false;
  }

  @Authorized<Permission>({ user: true, admin: true })
  @Mutation(() => News)
  async addNews(@Arg('news') news: NewsInput, @Ctx() ctx: Context): Promise<News> {
    logger.debug('Adding new News', news);

    try {
      return await this.newsService.createNews(news, ctx.user!);
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true, admin: true })
  @Mutation(() => News)
  async updateNews(@Arg('newsId', () => ID) newsId: string, @Arg('news') news: NewsInput): Promise<News> {
    logger.debug('Updating News', news);

    const [, dbNewsId] = fromGlobalId(newsId);
    try {
      return await this.newsService.updateNews(dbNewsId, news);
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true, admin: true })
  @Mutation(() => News)
  async deleteNews(@Arg('newsId', () => ID) newsId: string): Promise<News> {
    logger.debug('Deleting News', newsId);

    const [, dbNewsId] = fromGlobalId(newsId);

    try {
      return await this.newsService.deleteNews(dbNewsId);
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => News)
  async likeNews(
    @Arg('newsId', () => ID) newsId: string,
    @Arg('liked') liked: boolean,
    @Ctx() ctx: Context
  ): Promise<News> {
    logger.debug('Toggling liked for News', newsId);

    const [, dbNewsId] = fromGlobalId(newsId);

    try {
      return await this.newsService.likeNews(dbNewsId, liked, ctx.user!);
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }
}
