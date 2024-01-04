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

import { FieldResolver, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import {
  Activity,
  ActivityActivityDetails,
  CommentActivityDetails,
  IndexedActivityActivityDetails,
  IndexedCollaboratorActivityDetails,
  IndexedCommentActivityDetails,
  IndexedInsightActivityDetails,
  IndexedNewsActivityDetails,
  IndexedUserActivityDetails,
  InsightActivityDetails,
  InsightCollaboratorActivityDetails,
  NewsActivityDetails,
  UserActivityDetails
} from '../models/activity';
import { Insight } from '../models/insight';
import { News } from '../models/news';
import { User } from '../models/user';
import { ActivityService } from '../services/activity.service';
import { CommentService } from '../services/comment.service';
import { InsightService } from '../services/insight.service';
import { NewsService } from '../services/news.service';
import { UserService } from '../services/user.service';

@Service()
@Resolver(() => ActivityActivityDetails)
export class ActivityActivityDetailsResolver {
  constructor(private readonly activityService: ActivityService) {}

  @FieldResolver(() => Activity, { nullable: true })
  async activity(@Root() activityDetails: IndexedActivityActivityDetails): Promise<Activity | undefined> {
    if (activityDetails && 'activityId' in activityDetails) {
      return this.activityService.getActivity(activityDetails.activityId);
    }
  }
}

@Service()
@Resolver(() => CommentActivityDetails)
export class CommentActivityDetailsResolver {
  constructor(private readonly commentService: CommentService) {}

  @FieldResolver(() => Insight, { nullable: true })
  async comment(@Root() activityDetails: IndexedCommentActivityDetails): Promise<Comment | undefined> {
    if (activityDetails && 'commentId' in activityDetails) {
      return this.commentService.getComment(activityDetails.commentId) as unknown as Comment;
    }
  }
}

@Service()
@Resolver(() => InsightActivityDetails)
export class InsightActivityDetailsResolver {
  constructor(private readonly insightService: InsightService) {}

  @FieldResolver(() => Insight, { nullable: true })
  async insight(@Root() activityDetails: IndexedInsightActivityDetails): Promise<Insight | undefined> {
    if (activityDetails && 'insightId' in activityDetails) {
      return this.insightService.getInsight(activityDetails.insightId) as unknown as Insight;
    }
  }

  @FieldResolver(() => String, { nullable: true })
  commitMessage(@Root() activityDetails: IndexedInsightActivityDetails): string | undefined {
    return activityDetails.commitMessage;
  }
}

@Service()
@Resolver(() => InsightCollaboratorActivityDetails)
export class InsightCollaboratorActivityDetailsResolver {
  constructor(
    private readonly insightService: InsightService,
    private readonly userService: UserService
  ) {}

  @FieldResolver(() => Insight, { nullable: true })
  async insight(@Root() activityDetails: IndexedCollaboratorActivityDetails): Promise<Insight | undefined> {
    if (activityDetails && 'insightId' in activityDetails) {
      return this.insightService.getInsight(activityDetails.insightId) as unknown as Insight;
    }
  }

  @FieldResolver(() => User, { nullable: true })
  async user(@Root() activityDetails: IndexedUserActivityDetails): Promise<User | undefined> {
    if (activityDetails && 'userId' in activityDetails) {
      return this.userService.getUser(activityDetails.userId) as unknown as User;
    }
  }
}

@Service()
@Resolver(() => NewsActivityDetails)
export class NewsActivityDetailsResolver {
  constructor(private readonly newsService: NewsService) {}

  @FieldResolver(() => News, { nullable: true })
  async news(@Root() activityDetails: IndexedNewsActivityDetails): Promise<News | undefined> {
    if (activityDetails && 'newsId' in activityDetails) {
      return this.newsService.getNews(activityDetails.newsId) as unknown as News;
    }
  }
}

@Service()
@Resolver(() => UserActivityDetails)
export class UserActivityDetailsResolver {
  constructor(private readonly userService: UserService) {}

  @FieldResolver(() => User, { nullable: true })
  async user(@Root() activityDetails: IndexedUserActivityDetails): Promise<User | undefined> {
    if (activityDetails && 'userId' in activityDetails) {
      return this.userService.getUser(activityDetails.userId) as unknown as User;
    }
  }
}
