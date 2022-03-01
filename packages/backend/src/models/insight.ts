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

import { IndexedInsight } from '@iex/models/indexed/indexed-insight';
import { IndexedInsightConfig } from '@iex/models/indexed/indexed-insight-config';
import { IndexedInsightCreation } from '@iex/models/indexed/indexed-insight-creation';
import { IndexedInsightMetadata } from '@iex/models/indexed/indexed-insight-metadata';
import { ItemType } from '@iex/models/item-type';
import { RepositoryPermission } from '@iex/models/repository-permission';
import { Field, ObjectType, InputType, ID } from 'type-graphql';

import { Connection, Edge, PageInfo } from '../models/connection';
import { toGlobalId } from '../shared/resolver-utils';

import { BaseModel } from './base-model';
import { CommentConnection } from './comment';
import { InsightFile, InsightFileInput } from './insight-file';
import { InsightReadme, UpdatedReadme } from './insight-readme';
import { Repository } from './repository';
import { User, UserConnection } from './user';
import { UserPermissionConnection } from './user-permission';

@ObjectType()
export class InsightCreation implements IndexedInsightCreation {
  @Field({ nullable: true })
  template?: string;

  @Field({ nullable: true })
  clonedFrom?: string;

  @Field({ nullable: true })
  importedFrom?: string;
}

@InputType()
export class InsightCreationInput {
  @Field({ nullable: true })
  template?: string;

  @Field({ nullable: true })
  clonedFrom?: string;

  @Field({ nullable: true })
  importedFrom?: string;
}

@ObjectType()
export class InsightMetadata implements IndexedInsightMetadata {
  @Field({ nullable: true })
  publishedDate?: string;

  @Field({ nullable: true })
  team?: string;
}

@ObjectType()
export class InsightConfig implements IndexedInsightConfig {
  @Field(() => [String], { nullable: true })
  authors?: string[];

  @Field(() => [String], { nullable: true })
  excludedAuthors?: string[];
}

@InputType()
export class InsightMetadataInput {
  @Field({ nullable: true })
  publishedDate?: string;

  @Field({ nullable: true })
  team?: string;
}

@ObjectType()
export class Insight implements IndexedInsight {
  @Field(() => ID)
  get id(): string {
    return toGlobalId('insight', this.insightId);
  }

  @Field()
  fullName!: string;

  @Field()
  namespace!: string;

  @Field()
  name!: string;

  @Field()
  url!: string;

  @Field({ nullable: true })
  thumbnailUrl?: string;

  @Field()
  description?: string;

  @Field()
  repository!: Repository;

  @Field(() => UserPermissionConnection, { nullable: true })
  collaborators?: UserPermissionConnection;

  @Field(() => UserConnection)
  authors!: UserConnection;

  @Field()
  createdAt!: string;

  @Field()
  updatedAt!: string;

  @Field()
  syncedAt!: string;

  @Field()
  stars!: number;

  @Field()
  forks!: number;

  @Field(() => [String])
  tags!: string[];

  @Field(() => InsightReadme, { nullable: true })
  readme?: InsightReadme;

  @Field(() => [InsightFile], { nullable: true })
  files?: InsightFile[];

  @Field({ nullable: true })
  creation?: InsightCreation;

  @Field({ nullable: true })
  metadata?: InsightMetadata;

  @Field({ nullable: true })
  config?: InsightConfig;

  @Field(() => CommentConnection, { nullable: true })
  comments?: CommentConnection;

  @Field()
  viewerHasLiked!: boolean;

  @Field()
  viewerCanEdit!: boolean;

  @Field(() => String, { nullable: true })
  viewerPermission!: RepositoryPermission | null;

  @Field()
  viewCount!: number;

  @Field()
  likeCount!: number;

  @Field(() => UserConnection)
  likedBy!: UserConnection;

  @Field()
  commentCount!: number;

  @Field()
  itemType!: ItemType;

  insightId!: number;

  contributors!: User[];
}

@ObjectType()
export class InsightEdge implements Edge<Insight> {
  @Field({ nullable: true })
  cursor?: string;

  @Field({ nullable: true })
  score?: number;

  @Field(() => Insight)
  node!: Insight;
}

@ObjectType()
export class InsightConnection implements Connection<Insight> {
  @Field(() => PageInfo, { nullable: true })
  pageInfo?: PageInfo;

  @Field(() => [InsightEdge])
  edges!: InsightEdge[];
}

@InputType({ description: 'New Insight' })
export class NewInsight {
  @Field({ nullable: true })
  org?: string;

  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];
}

// TODO: Remove this and merge into DraftData
// Can do this after deleting the non-draft edit methods
@InputType({ description: 'Updated Insight' })
export class UpdatedInsight {
  @Field({ nullable: true })
  namespace?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  itemType!: ItemType;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => UpdatedReadme, { nullable: true })
  readme?: UpdatedReadme;

  @Field({ nullable: true })
  creation?: InsightCreationInput;

  @Field({ nullable: true })
  metadata?: InsightMetadataInput;

  @Field(() => [InsightFileInput], { nullable: true })
  files?: InsightFileInput[];
}

export class DbInsight extends BaseModel {
  static get tableName(): string {
    return 'insight';
  }

  static get idColumn(): string {
    return 'insightId';
  }

  insightId!: number;

  externalId!: string;

  insightName!: string;

  createdAt!: Date;

  updatedAt!: Date;

  deletedAt?: Date | null;

  repositoryTypeId!: number;

  repositoryData!: any;

  itemType!: ItemType;
}

@ObjectType()
export class ValidateInsightName {
  @Field()
  isNameUnique!: boolean;

  @Field()
  isFullNameUnique!: boolean;

  @Field({ nullable: true })
  existingInsight?: Insight;
}
