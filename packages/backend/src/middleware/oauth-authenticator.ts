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

import logger from '@iex/shared/logger';
import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';

import { makeOctokit } from '../lib/backends/github';
import { OAuthUserInfo } from '../models/oauth-user-info';
import { User } from '../models/user';

// TTL cache of bearer token -> OAuthUserInfo
export const oAuthUserInfoCache = new NodeCache({
  stdTTL: 600
});

// TTL cache of bearer token -> IEX User
export const userCache = new NodeCache({
  stdTTL: 600
});

export const ADMIN_USERNAMES = process.env.ADMIN_USERNAMES?.split(';') ?? [];

export const ADMIN_GROUPS = process.env.OAUTH_OKTA_ADMIN_GROUPS?.split(';') ?? [];

const isAdmin = (userInfo: OAuthUserInfo | undefined, user: User) => {
  if (ADMIN_USERNAMES.includes(user.userName)) {
    return true;
  }

  return userInfo?.groups?.some((group) => ADMIN_GROUPS.includes(group)) ?? false;
};

/**
 * Middleware for validating OAuth access tokens (if available). If valid, `req.oAuthUserInfo` will be set
 * with user information retrieved from Okta/GitHub.
 *
 * Additionally, the IEX user will be retrieved from the database, if available.  This value will be
 * added to `req.user`
 *
 * Note: This middleware does not reject unauthenticated requests. It does reject requests with invalid
 * bearer tokens, however.  Use the `requireAuth` middleware to reject requests without authentication.
 */
export async function oAuthAuthenticator(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Retrieve the bearer token from the request (maybe)
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/Bearer (.+)/);

  if (!match) {
    return next();
  }

  const accessToken = match[1];

  // Check cache for existing user
  let userInfo = oAuthUserInfoCache.get<OAuthUserInfo>(accessToken);
  let user: User | null | undefined = userCache.get<User>(accessToken);

  if (userInfo === undefined) {
    logger.info('[OAUTH_AUTHENTICATOR] User not in cache');
    try {
      switch (process.env.OAUTH_PROVIDER) {
        case 'okta': {
          const response = await axios.get(`${process.env.OAUTH_OKTA_BASE_URL}/oauth2/v1/userinfo`, {
            headers: { authorization: 'Bearer ' + accessToken }
          });

          userInfo = {
            ...response.data,

            // Preferred username is email, but that's not a great user name
            // Default to the first part of their email
            username: response.data.preferred_username.split('@')[0]
          };

          logger.debug(`[OAUTH_AUTHENTICATOR] Caching Okta user info for: ${userInfo?.email}`);

          oAuthUserInfoCache.set(accessToken, userInfo);

          break;
        }
        case 'github': {
          const octokit = makeOctokit(accessToken);
          const response = await octokit.users.getAuthenticated();

          userInfo = {
            username: response.data.login,
            email: response.data.email ?? undefined,
            name: response.data.name ?? undefined
          };
          logger.debug(`[OAUTH_AUTHENTICATOR] Caching GitHub user info for: ${userInfo?.email}`);

          oAuthUserInfoCache.set(accessToken, userInfo);

          break;
        }
        default: {
          res.status(500).send({
            data: null,
            errors: [
              {
                message: 'Unsupported OAuth provider',
                extensions: {
                  code: 'INTERNAL_SERVER_ERROR'
                },
                response: {
                  status: 500
                }
              }
            ]
          });
          return;
        }
      }
    } catch (error: any) {
      logger.error('[OAUTH_AUTHENTICATOR] Error verifying access token: ' + error);
      res.status(401).send({
        data: null,
        errors: [
          {
            message: 'Unauthorized: Error verifying access token',
            extensions: {
              code: 'FORBIDDEN'
            },
            response: {
              status: 401
            }
          }
        ]
      });
      return;
    }
  }

  if (user === undefined) {
    try {
      const email = userInfo?.email;
      user = await User.query()
        .where('email', email || '')
        .first();
      if (user) {
        user.isAdmin = isAdmin(userInfo, user);

        logger.debug(`[OAUTH_AUTHENTICATOR] Caching User for: ${email}`);
        userCache.set(accessToken, user);
      }
    } catch (error: any) {
      logger.error(`[OAUTH_AUTHENTICATOR] ${error}`);
    }
  }

  logger.info('[OAUTH_AUTHENTICATOR] Authenticated user: ' + userInfo?.email);

  req.token = accessToken;
  req.oAuthUserInfo = userInfo;
  req.user = user;
  next();
}
