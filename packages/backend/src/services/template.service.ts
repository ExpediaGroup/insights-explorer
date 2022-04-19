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

import { RequestParams } from '@elastic/elasticsearch';
import { SearchBody, SearchResponse } from '@iex/models/elasticsearch';
import { IndexedInsight } from '@iex/models/indexed/indexed-insight';
import { ItemType } from '@iex/models/item-type';
import { getLogger } from '@iex/shared/logger';
import { Service } from 'typedi';

import {
  getInsightByFullName as getInsightByFullNameFromElasticsearch,
  ElasticIndex,
  defaultElasticsearchClient,
  getInsight
} from '../lib/elasticsearch';
import { Insight } from '../models/insight';

const logger = getLogger('template.service');

@Service()
export class TemplateService {
  // These fields will always be requested even if not included in _source args
  private requiredSourceFields = ['insightId', 'fullName'];

  constructor() {
    logger.trace('Constructing New Template Service');
  }

  /**
   * Fetch an Insight Template by full name (from Elasticsearch)
   */
  async getTemplateByFullName(fullName: string, _source?: string[]): Promise<IndexedInsight | null> {
    return getInsightByFullNameFromElasticsearch(fullName, _source);
  }

  /**
   * Fetch an Insight Template by ID (from Elasticsearch)
   *
   * @param templateId Template ID
   */
  async getTemplate(templateId?: number, _source?: string[]): Promise<IndexedInsight | null> {
    if (templateId == null) {
      return null;
    }

    return getInsight(templateId, _source);
  }

  async getTemplates(_source?: string[]): Promise<Insight[]> {
    const query: RequestParams.Search<SearchBody> = {
      index: ElasticIndex.INSIGHTS,
      _source: _source?.concat(this.requiredSourceFields),
      body: {
        // Note: This is hardcoded at 100 just to avoid building out paging unnecessarily
        // In the event that there are over 100 templates, this will either
        // have to be increased or proper paging implemented.
        size: 100,
        sort: [{ updatedAt: { order: 'desc' } }],
        query: {
          match: { itemType: ItemType.TEMPLATE }
        }
      }
    };

    const result = await defaultElasticsearchClient.search<SearchResponse<IndexedInsight>, SearchBody>(query);

    return result.body.hits.hits.map((doc: { _source: IndexedInsight }) => {
      return doc._source as Insight;
    });
  }
}
