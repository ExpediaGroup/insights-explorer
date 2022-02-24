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

import { buildSchemaSync, AuthChecker, ResolverData } from 'type-graphql';

import { GqlErrorInterceptor } from '../middleware/gql-error-interceptor';
import { Context } from '../models/context';
import { Permission } from '../models/permission';

const authChecker: AuthChecker<any, Permission> = ({ context }, permissions) => {
  // Must have a valid bearer token
  if (!context.oAuthUserInfo) {
    return false;
  }

  const allowed = permissions
    // Evaluate each permission object
    .map((permission) => {
      // Authorization: `user`
      // Requires that the request was made by an IEX user,
      // e.g. they have successfully run the `login()` mutation.
      if (permission.user === true && !context.user) {
        return false;
      }

      // Authorization: `self`
      // Requires that an authenticated user is making a request for their own data.
      // This depends on the value `context.retrievedUserId` being set in the resolver!
      if (permission.self === true && context.retrievedUserId != context.user.userId) {
        return false;
      }

      // Authorization: `github`
      // Requires that an authenticated user has a registered Github Personal Access Token
      if (permission.github === true) {
        const { githubPersonalAccessToken } = context.user;
        if (githubPersonalAccessToken == null || githubPersonalAccessToken.length === 0) {
          return false;
        }
      }

      // Authorization: `admin`
      // Requires that an authenticated user is an admin.  This is configured with the
      // OAUTH_OKTA_ADMIN_GROUPS environment variable
      if (permission.admin === true) {
        return context.user.isAdmin;
      }

      return true;
    })
    // Ensure none of the permissions failed
    .every((v) => v === true);

  return allowed;
};

export const schema = buildSchemaSync({
  authChecker,
  container: ({ context }: ResolverData<Context>) => context.container,
  emitSchemaFile: true,
  globalMiddlewares: [GqlErrorInterceptor],
  resolvers: [__dirname + '/../resolvers/*.resolver.{ts,js}'],
  validate: false
});
