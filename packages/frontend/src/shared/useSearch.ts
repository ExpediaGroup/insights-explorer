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
  sort?: Sort;
  paused?: boolean;
}

// https://github.com/typescript-eslint/typescript-eslint/issues/2446
// type PaginationReturn = [{}, () => void];

export function useSearch({ query, sort, paused = false }: UseSearchProps): any {
  const [fetching, setFetching] = useState(true);
  const loadingNextPage = useRef(false);

  const [suggestedFilters, setSuggestedFilters] = useState<AutocompleteResults | undefined>();
  const [error, setError] = useState<CombinedError | string | undefined>();
  const total = useRef(0);

  const size = 20; // Fixed value for now
  const from = useRef<number>(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const pending = useRef(false);

  const fetchMore = useCallback(async () => {
    if (paused) {
      // Don't fetch when paused
      return;
    }

    if (!loadingNextPage.current) {
      // console.log(`Loading next page (from = ${from.current})`);
      loadingNextPage.current = true;

      const { data: nextPage, error } = await urqlClient
        .query(INSIGHTS_QUERY, {
          search: {
            query: query || '',
            sort: sort && [sort],
            paging: {
              from: from.current,
              size
            }
          }
        })
        .toPromise();

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

        // console.log('Finished loading page ' + from.current);
        from.current += size;
      }

      // Done!
      loadingNextPage.current = false;
      setFetching(false);

      // If a request is pending, process it now
      if (pending.current) {
        pending.current = false;
        fetchMore();
      }
    } else {
      // If a fetchMore request came while we were loading, pending is set true
      // This is here to trigger a subsequent page load to avoid cases where the
      // front-end component already triggered fetchMore(), but it was already loading.
      pending.current = true;
    }
  }, [paused, query, sort]);

  useEffect(() => {
    // Reset the scroll state whenever query/sort changes
    // console.log('Resetting infinite scroll');
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
