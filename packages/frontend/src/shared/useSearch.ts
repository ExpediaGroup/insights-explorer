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

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CombinedError } from 'urql';
import { gql } from 'urql';

import type { AutocompleteResults, SearchResult, Sort } from '../models/generated/graphql';
import { urqlClient } from '../urql';

const INSIGHTS_QUERY = gql`
  query SearchInsights($search: InsightSearch) {
    insights(search: $search) {
      results {
        score
        insight {
          id
          namespace
          name
          fullName
          description
          itemType
          tags
          likeCount
          commentCount
          authors {
            edges {
              node {
                id
                displayName
                userName
                avatarUrl
              }
            }
          }
          repository {
            owner {
              login
              avatarUrl
            }
          }
          viewerHasLiked
          updatedAt
          isUnlisted
        }
      }
      pageInfo {
        size
        from
        total
      }
      suggestedFilters {
        authors {
          value
          label
        }
        tags {
          value
        }
        teams {
          value
        }
      }
      internalRequest
    }
  }
`;

export interface UseSearchProps {
  query?: string;
  useNewSearch?: boolean;
  sort?: Sort;
  paused?: boolean;
}

export type SearchResultState = {
  data: {
    insights: {
      suggestedFilters?: AutocompleteResults;
      results: SearchResult[];
    };
  };
  error?: CombinedError | string;
  fetching: boolean;
  from: React.MutableRefObject<number>;
  hasMore: boolean;
  total: number;
};

export type UseSearchReturnType = [SearchResultState, () => Promise<void>];

/**
 * Custom hook for performing a search.
 *
 * This hook is designed to be used with an infinite scroll component,
 * so it returns both the search result state and a function to fetch more results.
 * The search results include the aggregated results from all pages that have been
 * loaded so far.
 *
 * Any changes to the query or sort options will reset the infinite scroll state
 * back to the first page of results.
 *
 * If multiple requests are made before the first one finishes, only the latest
 * request will be used.  Urql does not support cancelling requests, so this
 * is the best we can do.
 *
 * @param {UseSearchProps} options - The search options.
 * @param {string} options.query - The search query.
 * @param {string} options.sort - The sort option.
 * @param {boolean} [options.paused=false] - Whether the search is paused.
 * @returns {UseSearchReturnType} - The search result state and a function to fetch more results.
 */
export function useSearch({ query, useNewSearch = true, sort, paused = false }: UseSearchProps): UseSearchReturnType {
  const [fetching, setFetching] = useState(true);

  const [suggestedFilters, setSuggestedFilters] = useState<AutocompleteResults | undefined>();
  const [error, setError] = useState<CombinedError | string | undefined>();
  const total = useRef(0);

  const size = 20; // Fixed value for now
  const from = useRef<number>(0);
  const [results, setResults] = useState<SearchResult[]>([]);

  const latestRequest = useRef<string | undefined>();

  const fetchMore = useCallback(async () => {
    if (paused) {
      // Don't fetch when paused
      return;
    }

    // Generate a unique ID for this request so we can ignore old responses
    const requestId = `r||${query}||${sort}||${from.current}`;
    if (latestRequest.current === requestId) {
      // Ignore duplicate requests
      // The infinite scroll component may trigger multiple requests for the same page
      return;
    }

    latestRequest.current = requestId;

    console.log(`In useSearch, the current value of useNewSearch is ${useNewSearch}`);
    const { data: nextPage, error } = await urqlClient
      .query(INSIGHTS_QUERY, {
        search: {
          query: query || '',
          useNewSearch,
          sort: sort && [sort],
          paging: {
            from: from.current,
            size
          }
        }
      })
      .toPromise();

    if (latestRequest.current !== requestId) {
      // Ignore this response, it's for an old request
      return;
    }

    setError(error);

    if (nextPage != null) {
      if (from.current === 0) {
        // Replace results with the first page of a new search
        setResults(nextPage.insights.results);

        // Only use total and suggested filters from the first page of results
        total.current = nextPage.insights.pageInfo.total;
        setSuggestedFilters(nextPage.insights.suggestedFilters);
      } else {
        setResults((existing) => [...existing, ...nextPage.insights.results]);
      }

      from.current += size;
    }

    // Done!
    setFetching(false);
  }, [paused, query, useNewSearch, sort]);

  useEffect(() => {
    // Reset the scroll state whenever query/sort changes
    from.current = 0;
    setResults([]);
    setFetching(true);

    // Trigger loading the first page of data
    fetchMore();
  }, [fetchMore, query, sort]);

  return [
    {
      data: { insights: { suggestedFilters, results } },
      error,
      fetching,
      from,
      hasMore: results?.length < total.current,
      total: total.current
    },
    fetchMore
  ];
}
