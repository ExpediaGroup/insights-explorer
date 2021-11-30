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

import { RepositoryPermission } from '@iex/models/repository-permission';
import { Field, ObjectType } from 'type-graphql';

import { Connection, Edge } from './connection';
import { PageInfo } from './connection';
import { User as IUser } from './user';
import { User } from './user';

@ObjectType()
export class UserPermissionEdge implements Edge<IUser> {
  @Field()
  cursor!: string;

  @Field(() => User)
  node!: User;

  @Field()
  permission!: RepositoryPermission;
}

@ObjectType()
export class UserPermissionConnection implements Connection<IUser> {
  @Field(() => PageInfo, { nullable: true })
  pageInfo?: PageInfo;

  @Field(() => [UserPermissionEdge])
  edges!: UserPermissionEdge[];
}
