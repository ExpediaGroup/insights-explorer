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

import type { Server } from 'http';

import logger from '@iex/shared/logger';
import type { Request, Response } from 'express';
import express from 'express';
import morgan from 'morgan';

// Init express
const app = express();

app.set('port', Number(process.env.PORT || 3000));
app.set('env', process.env.NODE_ENV);

if (process.env.LOG_REQUESTS === 'true') {
  app.use(morgan('dev'));
}

// Add APIs
app.use('/', (req: Request, res: Response): void => {
  res.send('IEX Slackbot OK 👌');
});

// Export express instance
export const startHttpServer = async (): Promise<Server> => {
  return app.listen(app.get('port'), () => {
    logger.info(`IEX Slackbot started in ${app.get('env')} mode on port: ${app.get('port')}`);
  });
};
