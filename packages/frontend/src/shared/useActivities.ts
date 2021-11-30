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
import { CombinedError, gql, useMutation } from 'urql';

import { ActivityConnection, ActivityEdge, AutocompleteResults, Sort } from '../models/generated/graphql';
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

// https://github.com/typescript-eslint/typescript-eslint/issues/2446
// type PaginationReturn = [{}, () => void];

export function useActivities({ query = '', first = 10, after = null, sort, paused = false }: UseActivitiesProps): any {
  const [fetching, setFetching] = useState(true);
  const loadingNextPage = useRef(false);

  const [error, setError] = useState<CombinedError | string | undefined>();
  const total = useRef(0);

  const [suggestedFilters, setSuggestedFilters] = useState<AutocompleteResults | undefined>();
  const afterRef = useRef<string | null>(after);
  const hasMoreRef = useRef<boolean>(true);
  const [edges, setEdges] = useState<ActivityEdge[]>([]);
  const pending = useRef(false);

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

    if (!loadingNextPage.current) {
      //console.log(`Loading next page (after = ${afterRef.current})`);
      loadingNextPage.current = true;

      const { data, error } = await urqlClient
        .query(ACTIVITIES_QUERY, {
          search: query,
          first,
          after: afterRef.current,
          sort: sort && [sort]
        })
        .toPromise();

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
  }, [paused, query, sort, first]);

  useEffect(() => {
    //console.log('Resetting infinite scroll');
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
