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
import { gql, useMutation } from 'urql';

import type { ActivityConnection, ActivityEdge, AutocompleteResults, Sort } from '../models/generated/graphql';
import { urqlClient } from '../urql';

const ACTIVITIES_QUERY = gql`
  query Activities($search: String, $first: Float!, $after: String, $sort: [Sort!]) {
    activities(search: $search, first: $first, after: $after, sort: $sort) {
      pageInfo {
        total
        size
        hasNextPage
        endCursor
      }
      edges {
        cursor
        score
        node {
          id
          activityType
          occurredAt
          user {
            id
            displayName
            userName
            avatarUrl
          }
          details {
            __typename
            ... on UserActivityDetails {
              user {
                id
                displayName
                userName
                avatarUrl
              }
            }
            ... on InsightActivityDetails {
              commitMessage
              insight {
                id
                name
                fullName
                itemType
                description
                commentCount
                likeCount
                viewerHasLiked
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
                tags
              }
            }
            ... on InsightCollaboratorActivityDetails {
              insight {
                id
                name
                fullName
                itemType
                description
                commentCount
                likeCount
                viewerHasLiked
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
                tags
              }
              user {
                id
                displayName
                userName
                avatarUrl
              }
              permission
            }
            ... on CommentActivityDetails {
              comment {
                id
                commentText
                insight {
                  id
                  name
                  fullName
                  itemType
                }
              }
            }
            ... on LoginActivityDetails {
              loginCount
            }
            ... on NewsActivityDetails {
              news {
                id
                summary
              }
            }
          }
          isOwnActivity
          viewerHasLiked
          likeCount
          likedBy {
            edges {
              node {
                id
                displayName
              }
            }
          }
        }
      }
      suggestedFilters {
        activityInsights {
          value
          occurrences
        }
        activityUsers {
          value
          occurrences
        }
      }
    }
  }
`;

const LIKE_ACTIVITY_MUTATION = gql`
  mutation LikeActivity($activityId: ID!, $liked: Boolean!) {
    likeActivity(activityId: $activityId, liked: $liked) {
      id
      viewerHasLiked
      likeCount
      likedBy {
        edges {
          node {
            id
            displayName
          }
        }
      }
    }
  }
`;

export interface UseActivitiesProps {
  query?: string;
  sort?: Sort;
  first?: number;
  after?: string | null;
  paused?: boolean;
}

export type ActivityResultState = {
  data: {
    activityConnection?: ActivityConnection;
    suggestedFilters?: AutocompleteResults;
  };
  error?: CombinedError | string;
  fetching: boolean;
  after?: string | null;
  hasMore: boolean;
  total: number;
};

export type UseActivitiesReturnType = [
  ActivityResultState,
  () => Promise<void>,
  ({ activityId: string, liked: boolean }) => Promise<any>
];

/**
 * Custom hook for performing a search for activities.
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
 * @param {UseActivitiesProps} options - The search options.
 * @param {string} options.query - The search query.
 * @param {number} options.first - The number of results to fetch per page.
 * @param {string} options.after - The cursor to start fetching results from.
 * @param {string} options.sort - The sort option.
 * @param {boolean} [options.paused=false] - Whether the search is paused.
 * @returns {UseActivitiesReturnType} - The search result state and a function to fetch more results.
 */
export function useActivities({
  query = '',
  first = 10,
  after = null,
  sort,
  paused = false
}: UseActivitiesProps): UseActivitiesReturnType {
  const [fetching, setFetching] = useState(true);

  const [error, setError] = useState<CombinedError | string | undefined>();
  const total = useRef(0);

  const [suggestedFilters, setSuggestedFilters] = useState<AutocompleteResults | undefined>();
  const afterRef = useRef<string | null>(after);
  const hasMoreRef = useRef<boolean>(true);
  const [edges, setEdges] = useState<ActivityEdge[]>([]);

  const latestRequest = useRef<string | undefined>();

  const [, onLikeActivity] = useMutation(LIKE_ACTIVITY_MUTATION);

  const fetchMore = useCallback(async () => {
    if (paused) {
      // Don't fetch when paused
      return;
    }

    if (!hasMoreRef.current) {
      console.warn('Should not be attempting to fetch more when hasMore=false');
      return;
    }

    // Generate a unique ID for this request so we can ignore old responses
    const requestId = `r||${query}||${sort}||${first}||${afterRef.current}`;
    if (latestRequest.current === requestId) {
      // Ignore duplicate requests
      // The infinite scroll component may trigger multiple requests for the same page
      return;
    }

    latestRequest.current = requestId;

    const { data, error } = await urqlClient
      .query(ACTIVITIES_QUERY, {
        search: query,
        first,
        after: afterRef.current,
        sort: sort && [sort]
      })
      .toPromise();

    if (latestRequest.current !== requestId) {
      // Ignore this response, it's for an old request
      return;
    }

    setError(error);

    const nextPage = data?.activities;

    if (nextPage != null) {
      if (afterRef.current === null) {
        // Replace edges with the first page of a new search
        setEdges(nextPage.edges);

        // Only use total and suggested filters from the first page of results
        total.current = nextPage.pageInfo.total;
        setSuggestedFilters(nextPage.suggestedFilters);
      } else {
        setEdges((existing) => [...existing, ...nextPage.edges]);
      }

      //console.log('Finished loading page ', nextPage.pageInfo);
      afterRef.current = nextPage.pageInfo.endCursor;

      // If the endCursor is null, there are no results after the previous cursor
      hasMoreRef.current = nextPage.pageInfo.endCursor !== null;
    }

    // Done!

    setFetching(false);
  }, [paused, query, sort, first]);

  useEffect(() => {
    // Reset the scroll state whenever query/sort changes
    afterRef.current = null;
    hasMoreRef.current = true;
    setEdges([]);
    setFetching(true);

    // Trigger loading the first page of data
    fetchMore();
  }, [fetchMore, query, sort]);

  return [
    {
      data: {
        activityConnection: fetching
          ? undefined
          : ({ edges, pageInfo: { total: total.current } } as ActivityConnection),
        suggestedFilters
      },
      error,
      fetching,
      after,
      hasMore: hasMoreRef.current,
      total: total.current
    },
    fetchMore,
    onLikeActivity
  ];
}
