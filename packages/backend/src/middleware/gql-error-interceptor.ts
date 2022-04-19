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
import { DBError, NotNullViolationError, UniqueViolationError } from 'objection';
import { MiddlewareFn } from 'type-graphql';

const logger = getLogger('gql-error-interceptor');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GqlErrorInterceptor: MiddlewareFn<any> = async ({ context, info }, next) => {
  try {
    return await next();
  } catch (error: any) {
    // Mask certain errors to avoid exposing internals
    if (error instanceof UniqueViolationError) {
      logger.error(
        `Unique constraint ${error.constraint} failed for table ${error.table} and columns ${error.columns}`
      );
      throw new Error('An unexpected database error occurred');
    } else if (error instanceof NotNullViolationError) {
      logger.error(`Not null constraint failed for table ${error.table} and column ${error.column}`);
      throw new Error('An unexpected database error occurred');
    } else if (error instanceof DBError) {
      logger.error(`DB error ${error.nativeError}`);
      throw new Error('An unexpected database error occurred');
    } else {
      logger.warn('Unhandled GraphQL exception: ' + typeof error);

      // eslint-disable-next-line no-console
      console.log(error);
    }

    // Rethrow any other error types
    throw error;
  }
};
