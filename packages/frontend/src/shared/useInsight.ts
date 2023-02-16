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
import { useSelector } from 'react-redux';
import { gql, useMutation, useQuery } from 'urql';

import type { RootState } from '../store/store';

const INSIGHT_FRAGMENT = gql`
  fragment InsightFields on Insight {
    id
    name
    namespace
    fullName
    description
    itemType
    url
    createdAt
    updatedAt
    syncedAt
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
    collaborators {
      edges {
        permission
        node {
          id
          userName
        }
      }
    }
    tags
    viewCount
    likeCount
    commentCount
    repository {
      url
      type
      owner {
        login
        type
        avatarUrl
      }
      isMissing
    }
    readme {
      contents
      readingTime {
        minutes
      }
    }
    creation {
      template
      clonedFrom
    }
    metadata {
      team
      publishedDate
    }
    config {
      authors
      excludedAuthors
    }
    files {
      id
      name
      path
      mimeType
      size
      readonly
      conversions {
        mimeType
        path
      }
    }
    links {
      url
      name
      group
    }
    viewerHasLiked
    viewerCanEdit
    viewerPermission
  }
`;

const INSIGHT_QUERY = gql`
  ${INSIGHT_FRAGMENT}
  query FetchInsight($fullName: String!) {
    insight(fullName: $fullName) {
      ...InsightFields
    }
  }
`;

const INSIGHT_DELETE_MUTATION = gql`
  mutation InsightDelete($insightId: ID!, $archiveRepo: Boolean!) {
    deleteInsight(insightId: $insightId, archiveRepo: $archiveRepo)
  }
`;

const INSIGHT_LIKE_MUTATION = gql`
  ${INSIGHT_FRAGMENT}
  mutation LikeInsight($insightId: ID!, $liked: Boolean!) {
    likeInsight(insightId: $insightId, liked: $liked) {
      ...InsightFields
    }
  }
`;

const INSIGHT_VIEW_MUTATION = gql`
  mutation ViewInsight($insightId: ID!, $insightName: String!) {
    viewInsight(insightId: $insightId, insightName: $insightName) {
      id
      activityType
      occurredAt
    }
  }
`;

const CLONE_INSIGHT_MUTATION = gql`
  mutation cloneInsight($insightId: ID!) {
    cloneInsight(insightId: $insightId) {
      draftKey
    }
  }
`;

interface Props {
  fullName: string;
}

/**
 * Insight management hook.  Fetches, deletes, and likes an Insight by name.
 */
export function useInsight({ fullName }: Props): any {
  const { loggedIn } = useSelector((state: RootState) => state.user);
  const previousLoggedIn = useRef(loggedIn);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: INSIGHT_QUERY,
    variables: { fullName }
  });

  const [, deleteInsight] = useMutation(INSIGHT_DELETE_MUTATION);
  const [, likeInsight] = useMutation(INSIGHT_LIKE_MUTATION);
  const [, viewInsight] = useMutation(INSIGHT_VIEW_MUTATION);
  const [, cloneInsight] = useMutation(CLONE_INSIGHT_MUTATION);

  const refreshInsight = useCallback(() => {
    reexecuteQuery({ requestPolicy: 'network-only' });
  }, [reexecuteQuery]);

  useEffect(() => {
    // Track login status; if it changes we need to refresh the query
    if (loggedIn !== previousLoggedIn.current) {
      previousLoggedIn.current = loggedIn;
      setNeedsRefresh(true);
    }
  }, [loggedIn, needsRefresh, previousLoggedIn]);

  useEffect(() => {
    // Delay any refreshes until after in-progress fetches are complete
    if (!fetching && needsRefresh) {
      setNeedsRefresh(false);
      refreshInsight();
    }
  }, [needsRefresh, fetching, refreshInsight]);

  return [
    {
      data,
      error,
      fetching,
      insight: data?.insight
    },
    {
      cloneInsight,
      deleteInsight,
      likeInsight,
      refreshInsight,
      viewInsight
    }
  ];
}
