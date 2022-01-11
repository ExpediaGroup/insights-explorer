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

import cors from 'cors';
import { Router } from 'express';
import { graphqlUploadExpress } from 'graphql-upload';

import * as assetController from './controllers/assets.v1';
import * as avatarController from './controllers/avatars.v1';
import * as draftsController from './controllers/drafts.v1';
import { graphQLServer } from './controllers/graphql.v1';
import * as homeController from './controllers/home.v1';
import * as importController from './controllers/import.v1';
import * as insightsController from './controllers/insights.v1';
import * as webhookController from './controllers/webhook.v1';
import { oktaAuthenticator } from './middleware/okta-authenticator';
import { requestId } from './middleware/request-id';
import { requireAuth } from './middleware/require-auth';

export async function createRouter(): Promise<Router> {
  const router = Router();
  const v1Router = Router();

  // Wait for the graphql server to be ready
  await graphQLServer.start();

  /*
   * API routes
   */

  router.get('/api/', homeController.getIndex);
  router.use(requestId);
  router.use('/api/v1', v1Router);

  /*
   * API /v1/ Routes
   */

  v1Router.use(
    '/graphql',
    oktaAuthenticator,
    graphqlUploadExpress({ maxFileSize: 104_857_600, maxFiles: 50 }),
    graphQLServer.getMiddleware({ path: '/' })
  );
  v1Router.all('/webhook', webhookController.hook);

  // These routes require authentication
  v1Router.get('/insights/search', oktaAuthenticator, requireAuth, insightsController.search);
  v1Router.get('/insights/:namespace/:name', oktaAuthenticator, requireAuth, insightsController.getInsight);

  // These routes do not require authentication
  v1Router.get('/avatars/:key', avatarController.getAvatar);
  v1Router.head('/insights/:namespace/:name/assets/:filepath*', insightsController.headInsightFile);
  v1Router.get('/insights/:namespace/:name/assets/:filepath*', insightsController.getInsightFile);
  v1Router.get('/drafts/:draftKey/assets/:attachmentKey', draftsController.getDraftAttachment);

  v1Router.get('/changelog', assetController.getChangelog);
  v1Router.get('/markdown', assetController.getMarkdown);
  v1Router.all('/import', cors({ origin: true }), importController.importToDraft);

  return router;
}
