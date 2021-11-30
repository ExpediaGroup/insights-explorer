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

import { IndexedRepositoryPerson } from '@iex/models/indexed/indexed-repository-person';
import { PersonType } from '@iex/models/person-type';
import { RepositoryPermission } from '@iex/models/repository-permission';
import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class RepositoryPerson implements IndexedRepositoryPerson {
  @Field()
  login!: string;

  @Field()
  type!: PersonType;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  ldapDn?: string;

  @Field()
  avatarUrl!: string;

  @Field()
  externalId!: string;

  @Field({ nullable: true })
  permission?: RepositoryPermission;
}
