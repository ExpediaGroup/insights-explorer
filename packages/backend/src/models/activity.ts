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

import { GraphQLJSON } from 'graphql-type-json';
import { Field, ID, ObjectType } from 'type-graphql';
import { createUnionType, registerEnumType } from 'type-graphql';

import { AutocompleteResults } from './autocomplete';
import { Comment } from './comment';
import { Connection, Edge } from './connection';
import { PageInfo } from './connection';
import { Insight } from './insight';
import { News } from './news';
import { User, UserConnection } from './user';

export enum ActivityType {
  ADD_COLLABORATOR = 'ADD_COLLABORATOR',
  CREATE_COMMENT = 'CREATE_COMMENT',
  CREATE_INSIGHT = 'CREATE_INSIGHT',
  DELETE_COMMENT = 'DELETE_COMMENT',
  DELETE_INSIGHT = 'DELETE_INSIGHT',
  EDIT_COMMENT = 'EDIT_COMMENT',
  EDIT_INSIGHT = 'EDIT_INSIGHT',
  FOLLOW_USER = 'FOLLOW_USER',
  LIKE_ACTIVITY = 'LIKE_ACTIVITY',
  LIKE_COMMENT = 'LIKE_COMMENT',
  LIKE_INSIGHT = 'LIKE_INSIGHT',
  LIKE_NEWS = 'LIKE_NEWS',
  LOGIN = 'LOGIN',
  REMOVE_COLLABORATOR = 'REMOVE_COLLABORATOR',
  UNFOLLOW_USER = 'UNFOLLOW_USER',
  UNLIKE_ACTIVITY = 'UNLIKE_ACTIVITY',
  UNLIKE_COMMENT = 'UNLIKE_COMMENT',
  UNLIKE_INSIGHT = 'UNLIKE_INSIGHT',
  UNLIKE_NEWS = 'UNLIKE_NEWS',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  VIEW_INSIGHT = 'VIEW_INSIGHT'
}

registerEnumType(ActivityType, {
  name: 'ActivityType'
});

export interface IndexedCommentActivityDetails {
  commentId: number;
  commentText: string;
  insightId: number;
}
export interface IndexedInsightActivityDetails {
  insightId: number;
  insightName: string;
  commitMessage?: string;
}

export interface IndexedActivityActivityDetails {
  activityId: string;
}

export interface IndexedUserActivityDetails {
  userId: number;
}

export interface IndexedCollaboratorActivityDetails {
  userId: number;
  insightId: number;
  permission: string;
}

export interface IndexedNewsActivityDetails {
  newsId: number;
}

export interface IndexedLoginActivityDetails {
  isFirstLogin: boolean;
  loginCount: number;
}

export type IndexedActivityDetails =
  | Record<string, never>
  | IndexedActivityActivityDetails
  | IndexedCollaboratorActivityDetails
  | IndexedCommentActivityDetails
  | IndexedInsightActivityDetails
  | IndexedLoginActivityDetails
  | IndexedNewsActivityDetails
  | IndexedUserActivityDetails;

@ObjectType()
export class CommentActivityDetails {
  @Field({ nullable: true })
  insight?: Insight;

  @Field()
  comment!: Comment;
}

@ObjectType()
export class ActivityActivityDetails {
  @Field(() => Activity)
  activity!: any; // Avoid circular reference
}

@ObjectType()
export class InsightActivityDetails {
  // Insight is nullable since deleted Insights would be null.
  @Field({ nullable: true })
  insight?: Insight;
}

@ObjectType()
export class InsightCollaboratorActivityDetails {
  @Field({ nullable: true })
  insight?: Insight;

  @Field()
  user!: User;

  @Field()
  permission!: string;
}

@ObjectType()
export class NewsActivityDetails {
  @Field()
  news!: News;
}

@ObjectType()
export class UserActivityDetails {
  @Field()
  user!: User;
}

@ObjectType()
export class LoginActivityDetails {
  @Field()
  isFirstLogin!: boolean;

  @Field()
  loginCount!: number;
}

export const ActivityDetailsUnion = createUnionType({
  name: 'ActivityDetails',
  types: () =>
    [
      ActivityActivityDetails,
      CommentActivityDetails,
      InsightActivityDetails,
      InsightCollaboratorActivityDetails,
      NewsActivityDetails,
      LoginActivityDetails,
      UserActivityDetails
    ] as const,
  resolveType: (value) => {
    // Disambiguate between difference union types
    if ('activityId' in value) {
      return ActivityActivityDetails;
    }
    if ('commentId' in value) {
      return CommentActivityDetails;
    }
    if ('insightId' in value) {
      if ('permission' in value) {
        return InsightCollaboratorActivityDetails;
      }

      return InsightActivityDetails;
    }
    if ('loginCount' in value) {
      return LoginActivityDetails;
    }
    if ('newsId' in value) {
      return NewsActivityDetails;
    }
    if ('userId' in value) {
      return UserActivityDetails;
    }
  }
});

@ObjectType()
export class Activity {
  @Field(() => ID)
  get id(): string {
    return this.activityId;
  }

  @Field()
  occurredAt!: string;

  @Field(() => ActivityType)
  activityType!: ActivityType;

  @Field()
  user!: User;

  @Field()
  likeCount!: number;

  @Field()
  isOwnActivity!: boolean;

  @Field()
  viewerHasLiked!: boolean;

  @Field(() => UserConnection)
  likedBy!: UserConnection;

  @Field(() => ActivityDetailsUnion, { name: 'details', nullable: true })
  get detailsUnion(): typeof ActivityDetailsUnion | undefined {
    if (this.details === undefined || Object.keys(this.details).length === 0) {
      return undefined;
    }
    return this.details as any;
  }

  activityId!: string;

  details?: IndexedActivityDetails;
}

@ObjectType()
export class ActivityEdge implements Edge<Activity> {
  @Field()
  cursor!: string;

  @Field({ nullable: true })
  score?: number;

  @Field(() => Activity)
  node!: Activity;
}

@ObjectType()
export class ActivityConnection implements Connection<Activity> {
  @Field(() => PageInfo, { nullable: true })
  pageInfo?: PageInfo;

  @Field(() => [ActivityEdge])
  edges!: ActivityEdge[];

  @Field(() => AutocompleteResults)
  suggestedFilters!: AutocompleteResults;

  @Field(() => GraphQLJSON)
  internalRequest!: any;
}
