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

import type { TypedDocumentNode } from 'urql';
import { gql } from 'urql';

import type { User } from '../models/generated/graphql';
import { urqlClient } from '../urql';

type LikedByType = 'insight' | 'comment' | 'activity' | 'news';

const INSIGHT_LIKED_BY_QUERY = gql`
  query InsightLikedBy($id: ID!) {
    insight(insightId: $id) {
      id
      likedBy {
        edges {
          node {
            id
            displayName
            email
          }
        }
      }
    }
  }
`;

const COMMENT_LIKED_BY_QUERY = gql`
  query CommentLikedBy($id: ID!) {
    comment(commentId: $id) {
      id
      likedBy {
        edges {
          node {
            id
            displayName
            email
          }
        }
      }
    }
  }
`;

const ACTIVITY_LIKED_BY_QUERY = gql`
  query ActivityLikedBy($id: ID!) {
    activity(activityId: $id) {
      id
      likedBy {
        edges {
          node {
            id
            displayName
            email
          }
        }
      }
    }
  }
`;

const NEWS_LIKED_BY_QUERY = gql`
  query NewsLikedBy($id: ID!) {
    newsById(newsId: $id) {
      id
      likedBy {
        edges {
          node {
            id
            displayName
            email
          }
        }
      }
    }
  }
`;

const selectQuery = (type: LikedByType): TypedDocumentNode => {
  switch (type) {
    case 'insight': {
      return INSIGHT_LIKED_BY_QUERY;
    }
    case 'comment': {
      return COMMENT_LIKED_BY_QUERY;
    }
    case 'activity': {
      return ACTIVITY_LIKED_BY_QUERY;
    }
    case 'news': {
      return NEWS_LIKED_BY_QUERY;
    }
  }
};

export const useLikedBy = (type: LikedByType) => {
  const query = selectQuery(type);

  const onFetchLikedBy = async (id: any): Promise<User[]> => {
    const { data, error } = await urqlClient.query(query, { id }).toPromise();
    if (error || data === undefined) {
      return [];
    }

    if (type === 'news') {
      // Special wrapper
      return data.newsById.likedBy.edges.map((e) => e.node);
    }

    return data[type].likedBy.edges.map((e) => e.node);
  };

  return { onFetchLikedBy };
};
