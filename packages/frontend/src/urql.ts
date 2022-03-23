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

import type { KeyGenerator } from '@urql/exchange-graphcache';
import { cacheExchange } from '@urql/exchange-graphcache';
import type { IntrospectionData } from '@urql/exchange-graphcache/dist/types/ast/schema';
import { multipartFetchExchange } from '@urql/exchange-multipart-fetch';
import { retryExchange } from '@urql/exchange-retry';
import type { Source } from 'wonka';
import { pipe, tap } from 'wonka';

import type { OperationResult, Operation } from 'urql';
import { createClient, dedupExchange } from 'urql';

import schema from './introspection.json';
import type { Draft } from './models/generated/graphql';
import { userSlice } from './store/user.slice';

let store: { dispatch: any } | null = null;

const errorExchange =
  ({ forward }) =>
  (ops$: Source<Operation>): Source<OperationResult> => {
    return pipe(
      forward(ops$),
      tap((result) => {
        if (store && result.error?.response?.status === 401) {
          console.log('[ERROR EXCHANGE] Logging out...');
          store?.dispatch(userSlice.actions.logout());
        }
      })
    );
  };

/**
 * Creates a global GraphQL client.  This instance is shared
 * by all requests to take advantage of the built-in caching.
 */
export const urqlClient = createClient({
  url: '/api/v1/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange({
      // This map contains GraphQL types and their primary keys
      // Any types that should NOT be cached independently should be mapped to null
      keys: {
        AppSettings: () => null,
        AuthSettings: () => null,
        AutocompleteResults: () => null,
        ChatSettings: () => null,
        CommentActivityDetails: () => null,
        Draft: ((draft: Draft) => draft.draftKey) as unknown as KeyGenerator,
        GitHubSettings: () => null,
        InsightActivityDetails: () => null,
        InsightCollaboratorActivityDetails: () => null,
        InsightConfig: () => null,
        InsightCreation: () => null,
        InsightFile: () => null,
        InsightFileConversion: () => null,
        InsightLink: () => null,
        InsightMetadata: () => null,
        InsightReadingTime: () => null,
        InsightReadme: () => null,
        InsightSearchResults: () => null,
        LoginActivityDetails: () => null,
        NewsActivityDetails: () => null,
        Repository: () => null,
        RepositoryPerson: () => null,
        SearchResult: () => null,
        UniqueValue: () => null,
        UserActivityDetails: () => null,
        UserGitHubProfile: () => null,
        UserHealthCheck: () => null,
        ValidateInsightName: () => null
      },
      schema: schema as IntrospectionData,
      updates: {
        Mutation: {
          deleteInsight: (result, args, cache, info) => {
            // This will cause issues with the paged Insight search results, so commented out for now.
            // cache.invalidate({ __typename: 'Insight', id: args.insightId as number });
          },
          deleteNews: (result, args, cache, info) => {
            cache.invalidate({ __typename: 'News', id: args.newsId as number });
          },
          addNews: (result, args, cache, info) => {
            console.log('invalidate');
            cache.invalidate('Query', 'news', { first: 50 });
          }
        }
      }
    }),
    retryExchange({
      retryIf: (error) => {
        if (error?.response?.status === 401) {
          return false;
        }
        if (error && error.networkError) {
          return true;
        }

        return false;
      }
    }),
    errorExchange,
    multipartFetchExchange
  ]
});

export function enableAuthorization(oidcAccessToken: string): void {
  console.log('Access Token', oidcAccessToken);
  urqlClient.fetchOptions = () => {
    return {
      headers: { Authorization: `Bearer ${oidcAccessToken}` }
    };
  };
}

export function disableAuthorization(): void {
  urqlClient.fetchOptions = undefined;
}

export function provideStore(aStore: { dispatch: any } | null): void {
  store = aStore;
}
