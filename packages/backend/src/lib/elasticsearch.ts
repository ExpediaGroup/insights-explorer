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

import fs from 'fs';

import { Client, ClientOptions, RequestParams } from '@elastic/elasticsearch';
import { GetResponse, MgetResponse, SearchBody, SearchResponse } from '@iex/models/elasticsearch';
import { IndexedInsight } from '@iex/models/indexed/indexed-insight';
import { ItemType } from '@iex/models/item-type';
import { getLogger } from '@iex/shared/logger';
import {
  parseToElasticsearch as parseToElasticsearchOld,
  SearchMultiTerm as SearchMultiTermOld,
  SearchNestedOrFilter as SearchNestedOrFilterOld,
  SearchTerm as SearchTermOld
} from '@iex/shared/search';
import {
  parseToElasticsearch as parseToElasticsearchNew,
  SearchMultiTerm as SearchMultiTermNew,
  SearchNestedOrFilter as SearchNestedOrFilterNew,
  SearchTerm as SearchTermNew
} from '@iex/shared/search2';
import { detailedDiff } from 'deep-object-diff';
import { DateTime } from 'luxon';

import { UniqueValue } from '../models/autocomplete';
import { ConnectionArgs, Edge, Sort } from '../models/connection';
import { Insight, InsightConnection } from '../models/insight';
import { InsightSearch, InsightSearchResults, SearchResult } from '../models/insight-search';
import { User } from '../models/user';
import { fromElasticsearchCursor, toElasticsearchCursor } from '../shared/resolver-utils';

const logger = getLogger('elasticsearch');

// let useNewSearch = true;

// export function toggleUseNewSearch() {
//   useNewSearch = !useNewSearch;
//   logger.debug(`useNewSearch is now ${useNewSearch}`);
// }

// const parseToElasticsearch = useNewSearch ? parseToElasticsearchNew : parseToElasticsearchOld;
// const SearchMultiTerm = useNewSearch ? SearchMultiTermNew : SearchMultiTermOld;
// const SearchNestedOrFilter = useNewSearch ? SearchNestedOrFilterNew : SearchNestedOrFilterOld;
// const SearchTerm = useNewSearch ? SearchTermNew : SearchTermOld;

// TODO: Provide index generation strategies (e.g. monthly, per org, etc)

export enum ElasticIndex {
  ACTIVITIES = 'iex-activities',
  INSIGHTS = 'iex-insights',
  WEBHOOKS = 'iex-webhooks'
}

const defaultOptions: ClientOptions = {
  node: process.env.ELASTICSEARCH_NODE,
  maxRetries: Number.parseInt(process.env.ELASTICSEARCH_MAX_RETRIES || '3'),
  requestTimeout: Number.parseInt(process.env.ELASTICSEARCH_REQUEST_TIMEOUT || '60000')
};

const defaultSort: Sort = {
  field: 'updatedAt',
  direction: 'desc'
};

// These fields will always be requested even if not included in _source args
const requiredSourceFields = ['fullName', 'insightId'];

function normalizeSource(_source?: string[]): string[] | undefined {
  if (_source !== undefined) {
    return [..._source, ...requiredSourceFields];
  }
}

export function createElasticsearchClient(options: ClientOptions = defaultOptions): Client {
  return new Client({ ...defaultOptions, ...options });
}

export const defaultElasticsearchClient = createElasticsearchClient();

export async function getIndex(
  index: string,
  client: Client = defaultElasticsearchClient
): Promise<{ exists: boolean; index?: any; indexName?: string; raw?: any }> {
  logger.debug(`Getting Mapping for Index ${index}`);

  // Ensure index exists first
  const existResponse = await client.indices.exists({ index });
  if ((existResponse.body as unknown) === false) {
    // Does not exist
    return { exists: false };
  }

  // Get and return index mapping
  const getResponse = await client.indices.get({ index });
  const indexName = Object.keys(getResponse.body)[0];

  return {
    exists: true,
    indexName,
    raw: getResponse.body,
    index: getResponse.body[indexName]
  };
}

export async function deployMappings(client: Client = defaultElasticsearchClient): Promise<void> {
  if (process.env.ELASTICSEARCH_INIT_ON_STARTUP !== 'true') {
    return;
  }

  const timestamp = DateTime.utc().toFormat('yyyy-LL-dd-HHmmss');

  await Promise.all(
    Object.values(ElasticIndex).map(async (index) => {
      const { exists, indexName: existingIndexName, index: existingIndex } = await getIndex(index);

      const indexFile = fs.readFileSync(`indices/${index}.json`, { encoding: 'utf8' });
      const newIndex = JSON.parse(indexFile);
      logger.debug(`Loaded Elasticsearch index file for ${index}`);

      let create = false;
      let reindex = false;

      // Normalize a few things for the diff
      if (existingIndex) {
        delete existingIndex.aliases;

        const { analysis, number_of_replicas, number_of_shards } = existingIndex.settings.index;
        existingIndex.settings.index = { number_of_replicas, number_of_shards };

        if (analysis) {
          existingIndex.settings.analysis = analysis;
        }
      }

      const diff: Record<string, any> = detailedDiff(existingIndex, newIndex);

      if (!exists) {
        logger.debug(`Elasticsearch index ${index} does not exist and will be created.`);
        create = true;
      } else if (Object.keys(diff.added).length === 0 && Object.keys(diff.updated).length === 0) {
        logger.debug(`Elasticsearch index ${index} exists as ${existingIndexName} and does not need to be updated.`);
      } else {
        logger.debug(`Elasticsearch index ${index} exists as ${existingIndexName} and DOES need to be updated.`);
        logger.debug(`${JSON.stringify(diff, null, 2)}`);
        create = true;
        reindex = true;
      }

      if (create) {
        // Create a timestamped index, then use an alias
        const timestampedIndex = `${index}-${timestamp}`;
        logger.debug(`Creating Index ${timestampedIndex}`);

        await client.indices.create({
          index: timestampedIndex,
          body: indexFile
        });

        if (reindex && existingIndexName) {
          logger.debug(`Reindexing from ${existingIndexName} to ${timestampedIndex}`);
          await client.reindex({
            body: {
              source: {
                index: existingIndexName
              },
              dest: {
                index: timestampedIndex
              }
            }
          });
        }

        // Update alias to use new Index name
        await client.indices.updateAliases({
          body: {
            actions: [{ remove: { index: '*', alias: index } }, { add: { index: timestampedIndex, alias: index } }]
          }
        });
      }
    })
  );
}

export async function getInsight(
  insightId: number,
  _source?: string[],
  index = ElasticIndex.INSIGHTS
): Promise<IndexedInsight | null> {
  try {
    logger.debug(`Getting Insight with ID ${insightId}`);

    const result = await defaultElasticsearchClient.get<GetResponse<IndexedInsight>>({
      id: insightId.toString(),
      index,
      _source: normalizeSource(_source)
    });

    if (result.body._source) {
      const insight = { ...result.body._source };
      return insight;
    }
  } catch (error: any) {
    logger.warn(`Error getting Insight: ${error}`);
  }

  return null;
}

export async function getInsights(
  insightIds: number[],
  _source?: string[],
  index = ElasticIndex.INSIGHTS
): Promise<(IndexedInsight | null)[]> {
  logger.debug(`Getting Insights with ${insightIds.length} IDs`);

  if (insightIds.length === 0) {
    return [];
  }

  const result = await defaultElasticsearchClient.mget<MgetResponse<IndexedInsight>>({
    index,
    body: { ids: insightIds.map((id) => id.toString()) },
    _source: normalizeSource(_source)
  });

  if (result.body.docs) {
    const insights: (IndexedInsight | null)[] = result.body.docs.map((doc) => {
      if (doc.found) {
        const insight = { ...doc._source };
        return insight;
      } else {
        return null;
      }
    });

    return insights;
  }

  return [];
}

export async function getInsightByFullName(
  fullName: string,
  _source?: string[],
  index = ElasticIndex.INSIGHTS
): Promise<IndexedInsight | null> {
  const result = await defaultElasticsearchClient.search<SearchResponse<IndexedInsight>, SearchBody>({
    index,
    body: {
      query: {
        match: { 'fullName.keyword': fullName }
      }
    },
    _source: normalizeSource(_source)
  });

  if (result.body.hits.hits.length === 1) {
    const doc = result.body.hits.hits[0];
    const insight = { ...doc._source };

    return insight;
  } else {
    return null;
  }
}

/**
 * Converts user-facing sort field names to the Elasticsearch field name.
 *
 * @param field User-facing field name
 */
function getSortField(field: string | undefined): string {
  switch (field) {
    case undefined: {
      return defaultSort.field!;
    }
    case 'relevance': {
      return '_score';
    }
    case 'name': {
      return 'name.keyword';
    }
    case 'fullName': {
      return 'fullName.keyword';
    }
    case 'publishedDate': {
      return 'metadata.publishedDate';
    }
    default: {
      return field;
    }
  }
}

export async function searchInsights(
  search?: InsightSearch,
  user?: User,
  _source?: string[],
  index = ElasticIndex.INSIGHTS
): Promise<InsightSearchResults> {
  const query: RequestParams.Search<SearchBody> = {
    index,
    _source,
    search_type: process.env.ELASTICSEARCH_SEARCH_TYPE as any,
    body: {
      size: search?.paging?.size || 100,
      from: search?.paging?.from || 0,
      aggregations: {
        tags: {
          terms: {
            field: 'tags.keyword',
            size: 10
          }
        },
        authors: {
          terms: {
            field: 'contributors.userName.keyword',
            size: 10
          }
        },
        teams: {
          terms: {
            field: 'metadata.team.keyword',
            size: 10
          }
        }
      }
    }
  };

  if (search != null) {
    // Parse an IEX search into Elasticsearch query
    logger.info(
      `I'm doing a new search! query is ${search.query} I have access to useNewSearch: ${search.useNewSearch}`
    );
    // based on the search-bar.tsx useNewSearch state, we can choose which parseToElasticsearch to use
    // if useNewSearch is true, use the new parseToElasticsearch
    // if useNewSearch is false, use the old parseToElasticsearch

    // access useNewSearch
    const parseToElasticsearch = search.useNewSearch ? parseToElasticsearchNew : parseToElasticsearchOld;
    const SearchMultiTerm = search.useNewSearch ? SearchMultiTermNew : SearchMultiTermOld;
    const SearchNestedOrFilter = search.useNewSearch ? SearchNestedOrFilterNew : SearchNestedOrFilterOld;
    const SearchTerm = search.useNewSearch ? SearchTermNew : SearchTermOld;
    query.body!.query = parseToElasticsearch(search.query, (clauses) => {
      // This modifier function runs after parsing but before converting to Elasticsearch

      // If itemType isn't provided, default to {insight,page}
      const itemTypeClause = clauses.find(
        (clause) => (clause instanceof SearchTerm || clause instanceof SearchMultiTerm) && clause.key === 'itemType'
      );

      if (itemTypeClause === undefined) {
        clauses.push(new SearchMultiTerm('itemType', [ItemType.INSIGHT, ItemType.PAGE]));
      }

      // Only show listed insights
      // If unlisted, the user must be a collaborator
      // If `isUnlisted` is missing, assume it's false
      // This uses `filter` so it doesn't affect the score
      if (user) {
        clauses.push(
          new SearchNestedOrFilter([
            {
              bool: {
                should: [
                  {
                    term: {
                      isUnlisted: false
                    }
                  },
                  {
                    bool: {
                      must_not: [
                        {
                          exists: {
                            field: 'isUnlisted'
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            },
            {
              term: {
                '_collaborators.user.userName': {
                  value: user.userName
                }
              }
            }
          ])
        );
      }

      return clauses;
    });
    logger.debug(`Elasticsearch Query: ${JSON.stringify(query.body!.query, null, 2)}`);

    // If sort isn't provided, default to relevance (AKA _score)
    if (search.sort === undefined || search.sort.length === 0) {
      search.sort = [{ field: '_score', direction: 'desc' }];
    }

    // Add updatedAt:desc as a secondary sort if it isn't already included
    if (!search.sort.some((i) => i.field === 'updatedAt')) {
      search.sort.push({ field: 'updatedAt', direction: 'desc' });
    }

    query.body!.sort = search.sort.map((i) => {
      const obj: any = {};
      obj[getSortField(i.field)] = { order: i.direction || defaultSort.direction! };
      return obj;
    });
  }

  const elasticResponse = await defaultElasticsearchClient.search<SearchResponse<IndexedInsight>, SearchBody>(query);

  const results: SearchResult[] = elasticResponse.body.hits.hits.map(
    (doc: { _id: string; _source: IndexedInsight; _score: number }) => {
      const result = {
        score: doc._score,
        insight: { ...doc._source }
      };

      return result as SearchResult;
    }
  );

  return {
    results,
    pageInfo: {
      size: results.length,
      from: query.body!.from!,
      total: elasticResponse.body.hits.total.value
    },
    suggestedFilters: {
      authors: elasticResponse.body.aggregations.authors.buckets.map((bucket: { key: string; doc_count: number }) => {
        return {
          value: bucket.key,
          occurrences: bucket.doc_count
        };
      }),
      tags: elasticResponse.body.aggregations.tags.buckets.map((bucket: { key: string; doc_count: number }) => {
        return {
          value: bucket.key,
          occurrences: bucket.doc_count
        };
      }),
      teams: elasticResponse.body.aggregations.teams.buckets.map((bucket: { key: string; doc_count: number }) => {
        return {
          value: bucket.key,
          occurrences: bucket.doc_count
        };
      })
    },
    internalRequest: query
  };
}

/**
 * Removes an Insight from the Index
 *
 * @param insightId Insight ID
 * @param index Elasticsearch index name
 */
export async function deleteInsight(insightId: number, index = ElasticIndex.INSIGHTS): Promise<void> {
  await defaultElasticsearchClient.delete({
    index,
    id: insightId.toString()
  });
}

/**
 * Retrieves unique values for a field, sorted by frequency.
 *
 * @param field Elasticseach field name
 * @param size Maximum number of results to return
 * @param index Elasticsearch index name
 */
export async function uniqueTerms(field: string, size = 100, index = ElasticIndex.INSIGHTS): Promise<UniqueValue[]> {
  const query: RequestParams.Search<SearchBody> = {
    index,
    search_type: process.env.ELASTICSEARCH_SEARCH_TYPE as any,
    body: {
      size: 0,
      aggregations: {
        uniqueTerms: {
          terms: {
            field,
            size
          }
        }
      }
    }
  };

  const elasticResponse = await defaultElasticsearchClient.search<SearchResponse<any>, SearchBody>(query);

  const results: UniqueValue[] = elasticResponse.body.aggregations.uniqueTerms.buckets.map(
    (bucket: { key: string; doc_count: number }) => {
      return {
        value: bucket.key,
        occurrences: bucket.doc_count
      };
    }
  );

  return results;
}

export async function getInsightsByContributor(
  email: string,
  connectionArgs?: ConnectionArgs,
  _source?: string[],
  index = ElasticIndex.INSIGHTS
): Promise<InsightConnection> {
  logger.trace(`Retriving authored insights for ${email}`);

  const query: RequestParams.Search<SearchBody> = {
    index,
    _source: normalizeSource(_source),
    search_type: process.env.ELASTICSEARCH_SEARCH_TYPE as any,
    body: {
      query: {
        match: { 'contributors.email.keyword': email }
      },
      size: connectionArgs?.first || 20
    }
  };

  if (connectionArgs !== undefined) {
    // If sort isn't provided, default to updatedAt
    if (connectionArgs.sort === undefined || connectionArgs.sort.length === 0) {
      connectionArgs.sort = [{ field: 'updatedAt', direction: 'desc' }];
    }

    // Add updatedAd:desc as a secondary sort if it isn't already included
    // This works as a tiebreaker for any user-provided sort order
    if (!connectionArgs.sort.some((i) => i.field === 'updatedAt')) {
      connectionArgs.sort.push({ field: 'updatedAt', direction: 'desc' });
    }

    query.body!.sort = connectionArgs.sort.map((i) => {
      const obj: any = {};
      obj[getSortField(i.field)] = { order: i.direction || defaultSort.direction! };
      return obj;
    });

    // Add cursor if any
    if (connectionArgs.after) {
      query.body!.search_after = fromElasticsearchCursor(connectionArgs.after);
    }
  }

  const elasticResponse = await defaultElasticsearchClient.search<SearchResponse<Insight>, SearchBody>(query);

  const insights: Insight[] = elasticResponse.body.hits.hits.map((doc: { _id: string; _source: IndexedInsight }) => {
    const insight = { ...doc._source };

    return insight as unknown as Insight;
  });

  const edges: Edge<Insight>[] = insights.map((insight) => {
    return { node: insight, cursor: toElasticsearchCursor(new Date(insight.updatedAt).getTime(), insight.id) };
  });

  return {
    edges,
    pageInfo: {
      size: insights.length,
      total: elasticResponse.body.hits.total.value,
      startCursor: edges.length > 0 ? edges[0].cursor : undefined,
      endCursor: edges.length > 0 ? edges.at(-1)?.cursor : undefined,
      // Unable to determine this
      hasNextPage: true,
      // Backwards cursor isn't supported
      hasPreviousPage: false
    }
  };
}
