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
import { Resolver, FieldResolver, Root, ResolverInterface } from 'type-graphql';
import { Service } from 'typedi';

import { Repository } from '../models/repository';
import { InsightService } from '../services/insight.service';

const logger = getLogger('repository.resolver');

@Service()
@Resolver(() => Repository)
export class RepositoryResolver implements ResolverInterface<Repository> {
  constructor(private readonly insightService: InsightService) {}

  @FieldResolver()
  async isMissing(@Root() repository: Repository): Promise<boolean> {
    logger.debug('Fetching isMissing');

    return this.insightService.isRepositoryMissing(repository);
  }
}
