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
import { ApolloServer } from 'apollo-server-express';
import { Container } from 'typedi';

import { schema } from '../lib/graphql';

const server = new ApolloServer({
  schema,
  context: ({ req }) => {
    const requestId = req.id;

    // Scoped container
    logger.silly('[GRAPHQL.V1] Creating Container ' + requestId);
    const container = Container.of(requestId);

    const context = {
      container,
      requestId,
      token: req.token,
      oktaUserInfo: req.oktaUserInfo,
      user: req.user
    };

    container.set('context', context);

    return context;
  },
  // Enables a web UI at http://localhost:3001/api/v1/graphql
  playground: process.env.GRAPHQL_PLAYGROUND === 'true',
  plugins: [
    {
      requestDidStart: () => ({
        willSendResponse(requestContext) {
          // Remove the request's scoped container
          logger.silly('[GRAPHQL.V1] Terminating Container ' + requestContext.context.requestId);
          Container.reset(requestContext.context.requestId);
        }
      })
    }
  ],
  uploads: false
});

export default server;
