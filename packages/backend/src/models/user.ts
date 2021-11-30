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

import { Pojo } from 'objection';
import { Field, ObjectType, Authorized, InputType, ID } from 'type-graphql';

import { BaseModel } from '../models/base-model';
import { Permission } from '../models/permission';
import { encrypt, decrypt } from '../shared/crypto';
import { toGlobalId } from '../shared/resolver-utils';

import { Connection, Edge } from './connection';
import { PageInfo } from './connection';
import { InsightConnection } from './insight';
import { UserHealthCheck } from './user-health-check';

@ObjectType()
export class UserGitHubStatus {
  @Field()
  message!: string;

  @Field({ nullable: true })
  emoji?: string;
}

@ObjectType()
export class UserGitHubProfile {
  @Field()
  login!: string;

  @Field()
  avatarUrl!: string;

  @Field()
  url!: string;

  @Field()
  bio!: string;

  @Field()
  location!: string;

  @Field(() => UserGitHubStatus, { nullable: true })
  status?: UserGitHubStatus;
}

@ObjectType()
export class User extends BaseModel {
  static get tableName(): string {
    return 'user';
  }

  static get idColumn(): string {
    return 'userId';
  }

  @Field(() => ID)
  get id(): string {
    return toGlobalId('user', this.userId);
  }

  @Field()
  userName!: string;

  @Field()
  email!: string;

  @Field()
  displayName!: string;

  @Field()
  lastLoginAt!: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field()
  deletedAt!: Date;

  @Field()
  loginCount!: number;

  @Field({ nullable: true })
  currentStatus?: string;

  @Field({ nullable: true })
  locale?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  chatHandle?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  team?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => [String])
  skills!: string[];

  @Field({ nullable: true })
  readme?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field(() => ID, { nullable: true })
  get defaultTemplateId(): string | undefined {
    if (this.defaultTemplate == null) {
      return undefined;
    }

    return toGlobalId('insight', this.defaultTemplate);
  }

  @Authorized<Permission>({ user: true, self: true })
  @Field({ nullable: true })
  githubPersonalAccessToken?: string;

  @Field({ nullable: true })
  githubProfile?: UserGitHubProfile;

  @Field({ defaultValue: false })
  isAdmin!: boolean;

  @Field()
  isSelf!: boolean;

  @Field(() => InsightConnection, { nullable: true })
  authoredInsights?: InsightConnection;

  @Field(() => InsightConnection, { nullable: true })
  likedInsights?: InsightConnection;

  @Field()
  commentCount!: number;

  @Field()
  healthCheck!: UserHealthCheck;

  userId!: number;

  defaultTemplate?: number;

  avatar?: string;

  $parseDatabaseJson(json: Pojo): Pojo {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    json.githubPersonalAccessToken = decrypt(json.githubPersonalAccessToken);

    return json;
  }

  $formatDatabaseJson(json: Pojo): Pojo {
    // Remember to call the super class's implementation.
    json = super.$formatDatabaseJson(json);

    if (json.githubPersonalAccessToken !== undefined) {
      json.githubPersonalAccessToken = encrypt(json.githubPersonalAccessToken);
    }

    return json;
  }
}

@ObjectType()
export class UserEdge implements Edge<User> {
  @Field()
  cursor!: string;

  @Field(() => User)
  node!: User;
}

@ObjectType()
export class UserConnection implements Connection<User> {
  @Field(() => PageInfo, { nullable: true })
  pageInfo?: PageInfo;

  @Field(() => [UserEdge])
  edges!: UserEdge[];
}

@InputType({ description: 'Updated User' })
export class UpdateUserInput implements Partial<User> {
  @Field({ nullable: true })
  userName?: string;

  @Field({ nullable: true })
  githubPersonalAccessToken?: string;

  @Field({ nullable: true })
  currentStatus?: string;

  @Field({ nullable: true })
  locale?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  chatHandle?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  team?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => [String], { nullable: true })
  skills?: string[];

  @Field({ nullable: true })
  readme?: string;

  @Field({ nullable: true })
  defaultTemplateId?: string;

  @Field({ nullable: true })
  avatar?: string;
}

@ObjectType()
export class AvatarUploadResult {
  @Field()
  avatar!: string;

  @Field()
  avatarUrl!: string;
}
