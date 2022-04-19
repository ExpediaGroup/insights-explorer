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
import { Arg, Authorized, Ctx, FieldResolver, ID, Mutation, Query, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { Context } from '../models/context';
import { Draft, DraftKey, DraftInput } from '../models/draft';
import { Insight } from '../models/insight';
import { Permission } from '../models/permission';
import { User } from '../models/user';
import { DraftService } from '../services/draft.service';
import { InsightService } from '../services/insight.service';
import { UserService } from '../services/user.service';
import { fromGlobalId } from '../shared/resolver-utils';

const logger = getLogger('draft.resolver');

@Service()
@Resolver(() => Draft)
export class DraftResolver {
  constructor(
    private readonly draftService: DraftService,
    private readonly insightService: InsightService,
    private readonly userService: UserService
  ) {}

  @Authorized<Permission>({ user: true })
  @Query(() => Draft)
  async draftByKey(@Arg('draftKey') draftKey: DraftKey): Promise<Draft> {
    try {
      return await this.draftService.getDraft(draftKey);
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Query(() => [Draft])
  async draftsForUser(
    @Arg('userId') userId: string,
    @Arg('insightId', () => ID, { nullable: true }) insightId?: string
  ): Promise<Draft[]> {
    try {
      const [, dbUserId] = fromGlobalId(userId);
      const dbInsightId = insightId == null ? null : fromGlobalId(insightId)[1];

      return await this.draftService.getDraftsForUser(dbUserId, dbInsightId);
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Query(() => [Draft], { description: 'Retrieve all drafts for a user.' })
  async allDraftsForUser(@Arg('userId') userId: string): Promise<Draft[]> {
    try {
      const [, dbUserId] = fromGlobalId(userId);
      return await this.draftService.getDraftsForUser(dbUserId);
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  @FieldResolver(() => User, { nullable: true })
  async createdByUser(@Root() draft: Draft): Promise<User | null> {
    if (draft.createdByUserId == null) {
      return null;
    }

    return this.userService.getUser(draft.createdByUserId);
  }

  @FieldResolver(() => Insight, { nullable: true })
  async insight(@Root() draft: Draft): Promise<Insight | null> {
    if (draft.insightId == null) {
      return null;
    }

    return this.insightService.getInsight(draft.insightId) as Promise<Insight | null>;
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => Draft)
  async upsertDraft(@Arg('draft') draft: DraftInput, @Ctx() ctx: Context): Promise<Draft> {
    logger.debug('Upserting Draft', draft);

    try {
      const upserted = await this.draftService.upsertDraft(draft, ctx.user!);
      if (upserted.updatedAt == null) {
        upserted.updatedAt = new Date();
      }

      return upserted;
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => Draft)
  async deleteDraft(@Arg('draftKey') draftKey: DraftKey, @Ctx() ctx: Context): Promise<Draft> {
    logger.debug('Deleting Draft', draftKey);

    try {
      return await this.draftService.deleteDraft(draftKey, ctx.user!);
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true, github: true })
  @Mutation(() => Draft)
  async cloneInsight(@Arg('insightId', () => ID) insightId: string, @Ctx() ctx: Context): Promise<Draft> {
    logger.debug('Cloning Insight', insightId);

    try {
      const [, dbInsightId] = fromGlobalId(insightId);
      const sourceInsight = await this.insightService.getInsight(dbInsightId);

      if (sourceInsight == null) {
        throw new Error('Cannot clone from a non-existent Insight');
      }

      return await this.draftService.cloneInsight(sourceInsight, ctx.user!);
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }
}
