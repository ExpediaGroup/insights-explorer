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

/**
 * GraphQL API Authorization object.
 *
 * Contains flags that can be set to onforce certain authorization strategies
 * on incoming requests.
 */
export interface Permission {
  /**
   * If true, rejects requests not from a known IEX user
   */
  user?: boolean;

  /**
   * If true, rejects requests for data not owned by the authenticated user
   */
  self?: boolean;

  /**
   * If true, rejects requests from users without a GitHub Personal Access Token
   */
  github?: boolean;

  /**
   * If true, rejects requests from users who are not admins.  This is configured with the
   * OAUTH_OKTA_ADMIN_GROUPS environment variable
   */
  admin?: boolean;
}
