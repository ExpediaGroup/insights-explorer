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
 * Setup the winston logger.
 *
 * Documentation: https://github.com/winstonjs/winston
 */
import type { TransformableInfo } from 'logform';
import { createLogger, format, transports } from 'winston';

// Init Logger
const logger = createLogger({
  level: process.env.LOG_LEVEL
});

const errorStackFormat = format((info) => {
  if (info.stack) {
    // eslint-disable-next-line no-console
    console.log(info.stack);
    return false;
  }
  return info;
});

const getFormatPrinter = () => {
  if (process.env.LOG_TIMESTAMPS === 'true') {
    return (info: TransformableInfo) => `${info.timestamp} ${info.level}: ${info.message}`;
  }
  return (info: TransformableInfo) => `${info.level}: ${info.message}`;
};

let logFormat;

switch (process.env.LOG_FORMAT) {
  case 'json':
    logFormat = format.combine(format.timestamp(), format.json());
    break;

  case 'default':
    logFormat = format.combine(
      format.colorize(),
      format.timestamp(),
      format.printf(getFormatPrinter()),
      errorStackFormat()
    );

    break;
}

const consoleTransport = new transports.Console({
  format: logFormat
});

logger.add(consoleTransport);

logger.info(`Initialized logger in ${process.env.LOG_FORMAT} mode with log level ${process.env.LOG_LEVEL}`);

export default logger;
