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

import type { ClientOptions } from '@elastic/elasticsearch';
import { Client } from '@elastic/elasticsearch';
import type { SearchBody, SearchResponse } from '@iex/models/elasticsearch';
import type { IndexedInsight } from '@iex/models/indexed/indexed-insight';
import { getLogger } from '@iex/shared/logger';

const logger = getLogger('iex');

const defaultOptions: ClientOptions = {
  node: process.env.ELASTICSEARCH_NODE,
  maxRetries: Number.parseInt(process.env.ELASTICSEARCH_MAX_RETRIES || '3'),
  requestTimeout: Number.parseInt(process.env.ELASTICSEARCH_REQUEST_TIMEOUT || '60000')
};

let cachedElasticsearchClient: Client;

const getClient = () => {
  if (cachedElasticsearchClient === undefined) {
    cachedElasticsearchClient = new Client(defaultOptions);
  }
  return cachedElasticsearchClient;
};

export const getInsight = async (namespace: string, name: string): Promise<IndexedInsight | undefined> => {
  const fullName = `${namespace}/${name}`;
  logger.info(`Querying for Insight: ${fullName}`);

  const result = await getClient().search<SearchResponse<IndexedInsight>, SearchBody>({
    index: 'iex-insights',
    body: {
      query: {
        match: { 'fullName.keyword': fullName }
      }
    }
  });

  if (result.body.hits.hits.length === 1) {
    const doc = result.body.hits.hits[0];
    const insight = { ...doc._source };

    return insight;
  } else {
    return undefined;
  }
};
