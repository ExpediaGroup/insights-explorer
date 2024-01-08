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

import { useCallback } from 'react';
import { gql, useQuery } from 'urql';

type UserQuery = 'basic' | 'profile';

const BASIC_FRAGMENT = gql`
  fragment BasicUserFields on User {
    id
    userName
    email
    displayName
    createdAt
    avatarUrl
    currentStatus
    locale
    location
    title
    team
    chatHandle
    bio
    skills
    readme
    commentCount
  }
`;

// Fragment for the extra profile bits
const PROFILE_FRAGMENT = gql`
  fragment ProfileUserFields on User {
    authoredInsights(first: 50) {
      pageInfo {
        total
      }
      edges {
        node {
          id
          namespace
          name
          fullName
          description
          itemType
          tags
          authors {
            edges {
              node {
                id
                userName
                displayName
              }
            }
          }
          repository {
            owner {
              avatarUrl
              login
            }
          }
          likeCount
          commentCount
          viewerHasLiked
          isUnlisted
        }
      }
    }
    likedInsights(first: 50) {
      pageInfo {
        total
      }
      edges {
        node {
          id
          namespace
          name
          fullName
          description
          itemType
          tags
          authors {
            edges {
              node {
                id
                userName
                displayName
              }
            }
          }
          repository {
            owner {
              avatarUrl
              login
            }
          }
          likeCount
          commentCount
          viewerHasLiked
          isUnlisted
        }
      }
    }
    userComments(first: 50) {
      pageInfo {
        total
      }
      edges {
        node {
          commentText
          createdAt
          id
          insight {
            id
            fullName
            name
            itemType
          }
          isEdited
          isOwnComment
          likeCount
          updatedAt
        }
      }
    }
  }
`;

const BASIC_USER_QUERY = gql`
  ${BASIC_FRAGMENT}
  query BasicUserByUserName($userName: String!) {
    user(userName: $userName) {
      ...BasicUserFields
    }
  }
`;

const PROFILE_USER_QUERY = gql`
  ${BASIC_FRAGMENT}
  ${PROFILE_FRAGMENT}
  query UserProfile($userName: String!) {
    user(userName: $userName) {
      ...BasicUserFields
      ...ProfileUserFields
    }
  }
`;

const getQuery = (query: UserQuery) => {
  switch (query) {
    case 'basic': {
      return BASIC_USER_QUERY;
    }
    case 'profile': {
      return PROFILE_USER_QUERY;
    }
  }
};

interface Props {
  userName: string;
  query?: UserQuery;
}

/**
 * User management hook.  Fetches users by name
 */
export function useUser({ userName, query = 'basic' }: Props): any {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: getQuery(query),
    variables: { userName }
  });

  const refreshUser = useCallback(() => {
    reexecuteQuery({ requestPolicy: 'network-only' });
  }, [reexecuteQuery]);

  return [
    {
      data,
      error,
      fetching,
      user: data?.user
    },
    {
      refreshUser
    }
  ];
}
