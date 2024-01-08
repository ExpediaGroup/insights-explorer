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

import 'express-async-errors';

import path from 'path';

import { getLogger, httpLogger } from '@iex/shared/logger';
import compression from 'compression';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { nanoid } from 'nanoid';

import { security } from './middleware/security';
import { createRouter } from './router';

const logger = getLogger('server');

export async function createServer(): Promise<express.Express> {
  // Init express
  const app = express();

  app.set('port', Number(process.env.PORT || 3000));
  app.set('env', process.env.NODE_ENV);

  // Show routes called in console during development
  switch (process.env.NODE_ENV) {
    case 'development': {
      logger.info('Loading development middleware');
      app.use(security);
      break;
    }
    case 'production': {
      logger.info('Loading production middleware');
      app.use(security);
      break;
    }
    default: {
      logger.info('Actually ' + process.env.NODE_ENV);
    }
  }

  app.use(compression());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (process.env.LOG_REQUESTS === 'true') {
    app.use(
      httpLogger({
        genReqId: () => nanoid()
      })
    );
  }

  // Add APIs
  const router = await createRouter();
  app.use('/', router);

  // Print API errors
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, err);
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: err.message
    });
  });

  // Serve front-end
  const frontendDir = path.join(__dirname, '../../../frontend/dist');

  app.use(
    express.static(frontendDir, {
      redirect: false
    })
  );
  app.get(/^(?!\/api).+/, (req: Request, res: Response) => {
    res.sendFile('index.html', { root: frontendDir });
  });

  return app;
}
