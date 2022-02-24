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

import { Resolver, Query } from 'type-graphql';
import { Service } from 'typedi';

import { AppSettings, OAuthProvider } from '../models/app-settings';

@Service()
@Resolver(() => AppSettings)
export class AppSettingsResolver {
  /**
   * Returns an object of application configuration settings.
   *
   * Note: This cannot require authorization, as the client
   * needs the Okta settings provided by this very endpoint.
   */
  @Query(() => AppSettings)
  appSettings(): AppSettings {
    return {
      authSettings: {
        provider: process.env.OAUTH_PROVIDER as OAuthProvider,
        authorizeUrl: process.env.OAUTH_AUTHORIZE_URL,
        scopes: process.env.OAUTH_SCOPES,
        clientId: process.env.OAUTH_CLIENT_ID,
        issuer: process.env.OAUTH_OKTA_BASE_URL,
        pkceEnabled: process.env.OAUTH_PKCE_ENABLED === 'true'
      },
      gitHubSettings: {
        url: process.env.GITHUB_URL,
        graphqlApiUrl: process.env.GITHUB_GRAPHQL_API_URL,
        restApiUrl: process.env.GITHUB_REST_API_URL,
        defaultOrg: process.env.GITHUB_DEFAULT_ORG
      },
      iexScmUrl: process.env.IEX_SCM_URL,
      externalDocUrl: process.env.EXTERNAL_DOC_URL,
      externalVideosUrl: process.env.EXTERNAL_VIDEOS_URL,
      version: process.env.IEX_VERSION,
      chatSettings: {
        provider: process.env.CHAT_PROVIDER,
        channel: process.env.CHAT_CHANNEL,
        url: process.env.CHAT_URL
      }
    };
  }
}
