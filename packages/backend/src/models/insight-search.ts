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

import GraphQLJSON from 'graphql-type-json';
import { Field, InputType, ObjectType } from 'type-graphql';

import { PageInfo, Paging, Sort } from '../models/connection';

import { AutocompleteResults } from './autocomplete';
import { Insight } from './insight';

// TODO: Convert to connection schema

@ObjectType()
export class SearchResult {
  @Field(() => Insight)
  insight!: Insight;

  @Field({ nullable: true })
  score?: number;
}

@InputType()
export class InsightSearch {
  @Field()
  query!: string;

  @Field()
  useNewSearch!: boolean;

  @Field(() => [Sort], { nullable: true })
  sort?: Sort[];

  @Field({ nullable: true })
  paging?: Paging;
}

@ObjectType()
export class InsightSearchResults {
  @Field()
  pageInfo!: PageInfo;

  @Field(() => [SearchResult])
  results!: SearchResult[];

  @Field(() => GraphQLJSON)
  internalRequest!: any;

  @Field(() => AutocompleteResults)
  suggestedFilters!: AutocompleteResults;
}
