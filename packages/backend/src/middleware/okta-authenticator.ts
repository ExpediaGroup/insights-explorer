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

import { OktaUserInfo } from '../models/okta-user-info';
import { User } from '../models/user';

// TTL cache of bearer token -> OktaUserInfo
export const oktaUserInfoCache = new NodeCache({
  stdTTL: 600
});

// TTL cache of bearer token -> IEX User
export const userCache = new NodeCache({
  stdTTL: 600
});

export const ADMIN_GROUPS = process.env.OKTA_ADMIN_GROUPS?.split(';') ?? [];

/**
 * Middleware for validating Okta bearer tokens (if available). If valid, `req.oktaUserInfo` will be set
 * with user information retrieved from Okta.
 *
 * Additionally, the IEX user will be retrieved from the database, if available.  This value will be
 * added to `req.user`
 *
 * Note: This middleware does not reject unauthenticated requests. It does reject requests with invalid
 * bearer tokens, however.  Use the `requireAuth` middleware to reject requests without authentication.
 */
export async function oktaAuthenticator(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/Bearer (.+)/);

  if (!match) {
    return next();
  }

  const accessToken = match[1];

  let userInfo = oktaUserInfoCache.get<OktaUserInfo>(accessToken);
  let user: User | null | undefined = userCache.get<User>(accessToken);

  if (userInfo === undefined) {
    try {
      const response = await axios.get(`${process.env.OKTA_BASE_URL}/oauth2/v1/userinfo`, {
        headers: { authorization: 'Bearer ' + accessToken }
      });
      userInfo = response.data;
      logger.debug(`[OKTA AUTHENTICATOR] Caching Okta user info for: ${userInfo?.email}`);

      oktaUserInfoCache.set(accessToken, userInfo);
    } catch (error: any) {
      logger.error('[OKTA AUTHENTICATOR] Error verifying access token: ' + error);
      res.status(401).send('Unauthorized');
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
        user.isAdmin = userInfo?.groups?.some((group) => ADMIN_GROUPS.includes(group)) ?? false;

        logger.debug(`[OKTA AUTHENTICATOR] Caching User for: ${email}`);
        userCache.set(accessToken, user);
      }
    } catch (error: any) {
      logger.error(`[OKTA AUTHENTICATOR] ${error}`);
    }
  }

  req.token = accessToken;
  req.oktaUserInfo = userInfo;
  req.user = user;
  next();
}
