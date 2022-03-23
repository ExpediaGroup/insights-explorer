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

import { gql, useMutation, useQuery } from 'urql';

import { DeleteNewsMutation, DeleteNewsMutationVariables, NewsQuery } from '../models/generated/graphql';

const NEWS_FRAGMENT = gql`
  fragment NewsFields on News {
    id
    createdAt
    activeAt
    summary
    body
    author {
      id
      displayName
      email
    }
    likeCount
    viewerHasLiked
  }
`;

const NEWS_QUERY = gql`
  ${NEWS_FRAGMENT}
  query News($active: Boolean!) {
    news(active: $active, first: 50) {
      edges {
        cursor
        node {
          ...NewsFields
        }
      }
    }
  }
`;

const ADD_NEWS_MUTATION = gql`
  ${NEWS_FRAGMENT}
  mutation AddNews($news: NewsInput!) {
    addNews(news: $news) {
      ...NewsFields
    }
  }
`;

const UPDATE_NEWS_MUTATION = gql`
  ${NEWS_FRAGMENT}
  mutation UpdateNews($newsId: ID!, $news: NewsInput!) {
    updateNews(newsId: $newsId, news: $news) {
      ...NewsFields
    }
  }
`;

const DELETE_NEWS_MUTATION = gql`
  ${NEWS_FRAGMENT}
  mutation DeleteNews($newsId: ID!) {
    deleteNews(newsId: $newsId) {
      ...NewsFields
    }
  }
`;

const LIKE_NEWS_MUTATION = gql`
  ${NEWS_FRAGMENT}
  mutation LikeNews($newsId: ID!, $liked: Boolean!) {
    likeNews(newsId: $newsId, liked: $liked) {
      ...NewsFields
    }
  }
`;

// https://github.com/typescript-eslint/typescript-eslint/issues/2446
// type PaginationReturn = [{}, () => void];

export function useNews({ active = true }: { active?: boolean }) {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery<NewsQuery>({
    query: NEWS_QUERY,
    variables: {
      active
    }
  });

  const refreshNews = useCallback(() => {
    reexecuteQuery({ requestPolicy: 'network-only' });
  }, [reexecuteQuery]);

  const [{ error: addNewsError, fetching: addNewsFetching }, onAddNews] = useMutation(ADD_NEWS_MUTATION);
  const [{ error: updateNewsError, fetching: updateNewsFetching }, onUpdateNews] = useMutation(UPDATE_NEWS_MUTATION);
  const [{ error: deleteNewsError, fetching: deleteNewsFetching }, onDeleteNews] = useMutation<
    DeleteNewsMutation,
    DeleteNewsMutationVariables
  >(DELETE_NEWS_MUTATION);
  const [{ error: likeNewsError, fetching: likeNewsFetching }, onLikeNews] = useMutation(LIKE_NEWS_MUTATION);

  return {
    data,
    error,
    fetching,
    onAddNews,
    addNewsError,
    addNewsFetching,
    onDeleteNews,
    deleteNewsError,
    deleteNewsFetching,
    onLikeNews,
    likeNewsError,
    likeNewsFetching,
    onUpdateNews,
    updateNewsError,
    updateNewsFetching,
    refreshNews
  };
}
