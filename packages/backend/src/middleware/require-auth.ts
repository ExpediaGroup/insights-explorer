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
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware for rejecting unauthenticated requests.
 * Requires the oktaAuthenticator to process the Authorization header into `req.token` first.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.token === undefined) {
    logger.error('[REQUIRE_AUTH] Request did not contain authorization, or authorization was invalid.');
    res.status(401).send('Unauthorized');
    return;
  }

  next();
}
