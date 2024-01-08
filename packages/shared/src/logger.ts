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

import type { ChildLoggerOptions, Logger, LoggerOptions } from 'pino';
import { pino } from 'pino';
import type { HttpLogger, Options } from 'pino-http';
import pinoHttp from 'pino-http';

// Default, unconfigured logger
// Should be initialized at startup
let logger: Logger = pino();

/**
 * Initialize the default logger from environment variables.
 *
 * This is required since environment variables will be loaded dynamically and may
 * not be available when this module is loaded by Node.js.
 */
export const initializeLogger = (): Logger => {
  const options: LoggerOptions = {
    level: process.env.LOG_LEVEL || 'info'
  };

  switch (process.env.LOG_FORMAT) {
    case 'json': {
      // Default
      break;
    }

    case 'pretty':
    case 'default': {
      const ignore = ['hostname', 'module', 'pid'];

      if (process.env.LOG_TIMESTAMPS === 'false') {
        ignore.push('time');
      }

      options.transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: ignore.join(','),
          messageFormat: '[{module}] {msg}'
        }
      };

      break;
    }
  }

  logger = pino(options);
  logger.info(`Initialized logger in ${process.env.LOG_FORMAT} mode with log level ${process.env.LOG_LEVEL}`);
  return logger;
};

/**
 * Creates a child logger derived from the default logger.
 *
 * @param bindings Context bindings to apply to the child logger
 * @param options Optional logger options
 * @returns {Logger} A child logger
 */
export const childLogger = (bindings: pino.Bindings, options?: ChildLoggerOptions): Logger => {
  return logger.child(bindings, { ...options });
};

/**
 * Creates a new Http logger derived from the default logger.
 *
 * @returns {HttpLogger}
 */
export const httpLogger = (options?: Options): HttpLogger => {
  return pinoHttp({
    ...options,
    logger
  });
};

/**
 * Gets a logger instance.
 * @param module Optionally provides the module name
 * @returns {Logger} A logger instance
 */
export const getLogger = (module?: string): Logger => {
  if (module) {
    return childLogger({ module });
  }
  return logger;
};

// TODO: Remove default logger
export default logger;
