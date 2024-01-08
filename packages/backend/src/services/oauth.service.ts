/**
 * Copyright 2022 Expedia, Inc.
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

import axios from 'axios';
import { Service } from 'typedi';

@Service()
export class OAuthService {
  async getAccessToken(code: string): Promise<string> {
    switch (process.env.OAUTH_PROVIDER) {
      case 'github': {
        // Exchange the code for an access token
        // This is done server-side to keep the client_secret private
        // https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#2-users-are-redirected-back-to-your-site-by-github
        const response = await axios.post(
          process.env.OAUTH_GITHUB_ACCESS_TOKEN_URL!,
          {},
          {
            headers: {
              accept: 'application/json'
            },
            params: {
              client_id: process.env.OAUTH_CLIENT_ID!,
              client_secret: process.env.OAUTH_CLIENT_SECRET!,
              code
            }
          }
        );

        return response.data.access_token;
      }
      default: {
        throw new Error('OAuth provider not supported');
      }
    }
  }
}
