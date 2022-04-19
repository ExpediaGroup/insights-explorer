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

import { getLogger } from '@iex/shared/logger';
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault
} from 'apollo-server-core';
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';
import { Container } from 'typedi';

import { schema } from '../lib/graphql';

const logger = getLogger('graphql.v1');

const apolloConfig: ApolloServerExpressConfig = {
  schema,
  context: ({ req }) => {
    const requestId = req.id;

    // Scoped container
    logger.trace('Creating Container ' + requestId);
    const container = Container.of(requestId as string);

    const context = {
      container,
      requestId,
      token: req.token,
      oAuthUserInfo: req.oAuthUserInfo,
      user: req.user
    };

    container.set('context', context);

    return context;
  },
  plugins: [
    {
      async requestDidStart() {
        return {
          async willSendResponse(requestContext) {
            // Remove the request's scoped container
            logger.trace('Terminating Container ' + requestContext.context.requestId);
            Container.reset(requestContext.context.requestId);
          }
        };
      }
    },
    process.env.APOLLO_SANDBOX === 'true'
      ? // Enables a web UI at http://localhost:3001/api/v1/graphql
        ApolloServerPluginLandingPageLocalDefault({ footer: false })
      : ApolloServerPluginLandingPageProductionDefault({ footer: false })
  ]
};

const graphQLServer = new ApolloServer(apolloConfig);

export { graphQLServer };
