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
import { ResolveTree } from 'graphql-parse-resolve-info';
import { Arg, Authorized, Ctx, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { searchInsights } from '../lib/elasticsearch';
import { Context } from '../models/context';
import { InsightSearch, InsightSearchResults } from '../models/insight-search';
import { Permission } from '../models/permission';
import { Fields } from '../shared/field-parameter-decorator';

const logger = getLogger('insight.resolver');

@Service()
@Resolver()
export class InsightsResolver {
  @Authorized<Permission>({ user: true })
  @Query(() => InsightSearchResults)
  async insights(
    @Ctx() ctx: Context,
    @Fields() fields: { InsightSearchResults: any },
    @Arg('search', { nullable: true }) search?: InsightSearch
  ): Promise<InsightSearchResults> {
    try {
      return await searchInsights(search, ctx.user, this.getElasticsearchFields(fields));
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  // Extract GraphQL requested fields to pass to Elasticsearch
  private getElasticsearchFields(fields: { InsightSearchResults: { [str: string]: ResolveTree } }): string[] {
    const requestedFields = Object.keys(
      fields.InsightSearchResults.results.fieldsByTypeName.SearchResult.insight.fieldsByTypeName.Insight
    );
    return [...new Set([...requestedFields, 'insightId', 'contributors', 'repository'])];
  }
}
