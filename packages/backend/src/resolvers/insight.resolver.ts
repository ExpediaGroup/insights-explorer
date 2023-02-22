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

import { RepositoryPermission } from '@iex/models/repository-permission';
import { RepositoryType } from '@iex/models/repository-type';
import { getLogger } from '@iex/shared/logger';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { Arg, Authorized, Ctx, ID, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { syncInsight } from '../lib/backends/sync';
import { getInsight } from '../lib/elasticsearch';
import { Activity, ActivityType, IndexedInsightActivityDetails } from '../models/activity';
import { CommentConnection } from '../models/comment';
import { Context } from '../models/context';
import { DraftKey } from '../models/draft';
import { Insight, DbInsight, ValidateInsightName, InsightChangeConnection } from '../models/insight';
import { Permission } from '../models/permission';
import { Repository } from '../models/repository';
import { User, UserConnection } from '../models/user';
import { UserPermissionConnection } from '../models/user-permission';
import { ActivityService } from '../services/activity.service';
import { ChangeHistoryService } from '../services/change-history.service';
import { CommentService } from '../services/comment.service';
import { DraftService } from '../services/draft.service';
import { InsightService } from '../services/insight.service';
import { UserService } from '../services/user.service';
import { Fields } from '../shared/field-parameter-decorator';
import { fromGlobalId, toCursor } from '../shared/resolver-utils';

const logger = getLogger('insight.resolver');

@Service()
@Resolver(() => Insight)
export class InsightResolver {
  constructor(
    private readonly activityService: ActivityService,
    private readonly changeHistoryService: ChangeHistoryService,
    private readonly commentService: CommentService,
    private readonly draftService: DraftService,
    private readonly insightService: InsightService,
    private readonly userService: UserService
  ) {}

  /**
   * Queries for a single Insight by either ID or full name.
   *
   * When querying by ID, an error is thrown if the ID does not match.
   * When querying by full name, null is returned if the ID does not match.
   *
   * If neither argument is provided, an error is thrown.
   *
   * @param fields GraphQL query fields
   * @param insightId Insight ID (optional)
   * @param fullName Insight full name (optional)
   */
  @Authorized<Permission>({ user: true })
  @Query(() => Insight, { nullable: true })
  async insight(
    @Fields() fields: { Insight: { [str: string]: ResolveTree } },
    @Arg('insightId', () => ID, { nullable: true }) insightId?: string,
    @Arg('fullName', { nullable: true }) fullName?: string
  ): Promise<Insight | null> {
    try {
      let insight: Insight | null = null;

      if (insightId === undefined && fullName === undefined) {
        throw new Error('One of `insightId` or `fullName` arguments is required');
      }

      if (insightId != null) {
        const [, dbInsightId] = fromGlobalId(insightId);
        insight = (await getInsight(dbInsightId, this.getRequestedFields(fields))) as Insight;

        if (insight === null) {
          throw new Error('Unable to retrieve insight with id: ' + insightId);
        }
      } else if (fullName != null) {
        insight = (await this.insightService.getInsightByFullName(
          fullName,
          this.getRequestedFields(fields)
        )) as Insight;
      }

      return insight;
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Query(() => Insight, { nullable: true })
  async insightByFullName(
    @Fields() fields: { Insight: { [str: string]: ResolveTree } },
    @Arg('fullName') fullName: string
  ): Promise<Insight | null> {
    logger.debug(`Insight by Full Name: ${fullName}`);
    try {
      const insight = (await this.insightService.getInsightByFullName(
        fullName,
        this.getRequestedFields(fields)
      )) as Insight;

      return insight;
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Query(() => ValidateInsightName)
  async validateInsightName(
    @Arg('name') name: string,
    @Arg('namespace') namespace: string
  ): Promise<ValidateInsightName> {
    logger.debug(`Insight by Display Name: ${name}`);
    try {
      const validation = await this.insightService.validateInsightName(name, namespace);
      return validation;
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  @FieldResolver()
  url(@Root() insight: Insight): string | undefined {
    if (insight.fullName) {
      return `${process.env.PUBLIC_URL}/insight/${insight.fullName}`;
    }
  }

  @FieldResolver()
  thumbnailUrl(@Root() insight: Insight): string | undefined {
    if (insight.thumbnailUrl) {
      return `${process.env.PUBLIC_URL}/api/v1/insights/${insight.fullName}/assets/${insight.thumbnailUrl}`;
    }
  }

  @FieldResolver()
  async authors(@Root() insight: Insight): Promise<UserConnection> {
    if (insight.contributors == null || insight.contributors.length === 0) {
      return { edges: [] };
    }

    const users = await Promise.all(
      insight.contributors.map((contributor) => {
        return contributor.userId
          ? this.userService.getUser(contributor.userId)
          : ({
              ...contributor,
              userId: `unknown:${contributor.userName}`
            } as unknown as User);
      })
    );

    return {
      edges: users.map((u, i) => ({
        cursor: toCursor('User', i),
        node: u
      }))
    };
  }

  @FieldResolver()
  async collaborators(@Root() insight: Insight): Promise<UserPermissionConnection> {
    const users = await this.insightService.getCollaborators(insight);

    return {
      edges: users.map(({ user, permission }, i) => ({
        cursor: toCursor('User', i),
        node: user as User,
        permission
      }))
    };
  }

  @FieldResolver(() => CommentConnection)
  async comments(@Root() insight: Insight): Promise<CommentConnection> {
    const comments = await this.commentService.insightComments(insight.insightId);

    return {
      edges: comments.map((c, i) => ({
        cursor: toCursor('Comment', i),
        node: c
      }))
    };
  }

  @FieldResolver()
  async commentCount(@Root() insight: Insight): Promise<number> {
    return this.insightService.commentCount(insight.insightId);
  }

  @FieldResolver()
  async viewCount(@Root() insight: Insight): Promise<number> {
    return this.insightService.getViewCount(insight.insightId);
  }

  @FieldResolver()
  async likeCount(@Root() insight: Insight): Promise<number> {
    return this.insightService.likeCount(insight.insightId);
  }

  @FieldResolver()
  async likedBy(@Root() insight: Insight): Promise<UserConnection> {
    if (insight.likeCount == 0) {
      return { edges: [] };
    }

    const userIds = await this.insightService.likedBy(insight.insightId);
    const users = await Promise.all(userIds.map((id) => this.userService.getUser(id)));

    return {
      edges: users.map((u, i) => ({
        cursor: toCursor('User', i),
        node: u
      }))
    };
  }

  @FieldResolver()
  async viewerHasLiked(@Root() insight: Insight, @Ctx() ctx: Context): Promise<boolean> {
    if (insight.viewerHasLiked != undefined) {
      // Already loaded, use the existing value
      return insight.viewerHasLiked;
    }

    return ctx.user ? this.insightService.doesUserLikeInsight(insight.insightId, ctx.user) : false;
  }

  @FieldResolver()
  async viewerCanEdit(@Root() insight: Insight, @Ctx() ctx: Context): Promise<boolean> {
    return ctx.user ? this.insightService.canUserEdit(insight, ctx.user) : false;
  }

  @FieldResolver({ nullable: true })
  async viewerPermission(@Root() insight: Insight, @Ctx() ctx: Context): Promise<RepositoryPermission | null> {
    return ctx.user ? this.insightService.getUserPermission(insight, ctx.user) : null;
  }

  @FieldResolver(() => InsightChangeConnection)
  async changeHistory(@Root() insight: Insight): Promise<InsightChangeConnection> {
    const changes = await this.changeHistoryService.getChangeHistory(insight);
    return {
      edges: changes.map((c, i) => ({
        cursor: toCursor('InsightChange', i),
        node: c
      }))
    };
  }

  @FieldResolver()
  async isUnlisted(@Root() insight: Insight): Promise<boolean> {
    return insight.isUnlisted ?? false;
  }

  @Authorized<Permission>({ user: true, github: true })
  @Mutation(() => Insight)
  async publishDraft(@Arg('draftKey') draftKey: DraftKey, @Ctx() ctx: Context): Promise<Insight> {
    logger.debug('Publishing Draft Key', draftKey);

    try {
      const draft = await this.draftService.getDraft(draftKey);
      let repository: Repository;

      if (draft.insightId == null) {
        // Create new Insight
        const insight = await this.insightService.createInsight(draft, ctx.user!);
        repository = insight.repository;
      } else {
        // Update existing Insight.
        const insight = (await getInsight(draft.insightId)) as Insight;

        if (insight == null) {
          throw new Error('This draft references an unknown Insight');
        }

        if (insight == null) {
          logger.error(`Unknown Insight: '${draft.insightId!}'`);
          throw new Error(`Unknown Insight: '${draft.insightId!}'`);
        }

        // Apply actual changes to repository
        await this.insightService.updateInsight(insight, draft, ctx.user!);

        repository = insight.repository;
      }

      // Delete draft after publishing
      await this.draftService.deleteDraft(draftKey, ctx.user!);

      // Force a sync of the repository to avoid showing the user un-synced data
      const insight = (await syncInsight({
        owner: repository.owner.login,
        repo: repository.externalName,
        repositoryType: RepositoryType.GITHUB,
        refresh: true,
        updated: true
      })) as Insight;

      // Log activity
      if (draft.insightId == null) {
        this.activityService.recordActivity(ActivityType.CREATE_INSIGHT, ctx.user!, {
          insightId: insight.insightId,
          insightName: insight.fullName,
          commitMessage: draft.draftData.commitMessage
        });
      } else {
        this.activityService.recordActivity(ActivityType.EDIT_INSIGHT, ctx.user!, {
          insightId: insight.insightId,
          insightName: insight.fullName,
          commitMessage: draft.draftData.commitMessage
        });
      }

      return insight!;
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => Insight)
  async likeInsight(
    @Fields() fields: { Insight: { [str: string]: ResolveTree } },
    @Arg('insightId', () => ID) insightId: string,
    @Arg('liked') liked: boolean,
    @Ctx() ctx: Context
  ): Promise<Insight> {
    logger.debug('Toggling liked for Insight', insightId);

    try {
      const [, dbInsightId] = fromGlobalId(insightId);
      await this.insightService.likeInsight(dbInsightId, liked, ctx.user!);

      const insight = (await getInsight(dbInsightId, this.getRequestedFields(fields))) as Insight;

      return insight!;
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => Activity)
  async viewInsight(
    @Arg('insightId', () => ID) insightId: string,
    @Arg('insightName') insightName: string,
    @Ctx() ctx: Context
  ): Promise<Activity> {
    logger.debug('Recording view Insight', insightId);

    try {
      const [, dbInsightId] = fromGlobalId(insightId);
      const details = {
        insightId: dbInsightId,
        insightName: insightName
      } as IndexedInsightActivityDetails;

      return this.insightService.viewInsight(details, ctx.user!);
    } catch (error: any) {
      logger.error(error.message);
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => Insight)
  async syncInsight(@Arg('insightId', () => ID) insightId: string): Promise<Insight | null> {
    logger.debug('Syncing Insight', insightId);

    const [, dbInsightId] = fromGlobalId(insightId);
    const dbInsight = await DbInsight.query().where('insightId', dbInsightId).first();

    if (dbInsight == null) {
      logger.error(`Unknown Insight: '${dbInsight}'`);
      throw new Error(`Unknown Insight: '${dbInsight}'`);
    }

    try {
      // Force a sync of the repository to avoid showing the user un-synced data
      const insight = await syncInsight({
        // TODO: Replace with relation
        repositoryType: RepositoryType.GITHUB,
        ...dbInsight.repositoryData
      });

      return insight as Insight;
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true, github: true })
  @Mutation(() => ID)
  async deleteInsight(
    @Arg('insightId', () => ID) insightId: string,
    @Arg('archiveRepo') archiveRepo: boolean,
    @Ctx() ctx: Context
  ): Promise<string> {
    logger.debug('Deleting Insight', insightId);

    try {
      const [, dbInsightId] = fromGlobalId(insightId);

      // Delete Insight
      await this.insightService.deleteInsight(dbInsightId, archiveRepo, ctx.user!);

      return insightId;
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true, github: true })
  @Mutation(() => Insight)
  async addCollaborator(
    @Arg('insightId', () => ID) insightId: string,
    @Arg('userId', () => ID) userId: string,
    @Ctx() ctx: Context,
    @Fields() fields: { Insight: { [str: string]: ResolveTree } },
    @Arg('permission', { nullable: true }) permission?: RepositoryPermission
  ): Promise<Insight> {
    logger.debug('Adding Collaborator', insightId);

    try {
      const [, dbInsightId] = fromGlobalId(insightId);
      const [, dbUserId] = fromGlobalId(userId);

      const collaborator = await this.userService.getUser(dbUserId);
      const insight = (await getInsight(dbInsightId, this.getRequestedFields(fields))) as Insight;

      await this.insightService.addCollaborator(insight, collaborator, ctx.user!, permission);

      return insight;
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true, github: true })
  @Mutation(() => Insight)
  async removeCollaborator(
    @Arg('insightId', () => ID) insightId: string,
    @Arg('userId', () => ID) userId: string,

    @Ctx() ctx: Context,
    @Fields() fields: { Insight: { [str: string]: ResolveTree } }
  ): Promise<Insight> {
    logger.debug('Removing Collaborator', insightId);

    try {
      const [, dbInsightId] = fromGlobalId(insightId);
      const [, dbUserId] = fromGlobalId(userId);

      const collaborator = await this.userService.getUser(dbUserId);
      const insight = (await getInsight(dbInsightId, this.getRequestedFields(fields))) as Insight;

      await this.insightService.removeCollaborator(insight, collaborator, ctx.user!);

      return insight;
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  @Authorized<Permission>({ user: true, github: true })
  @Mutation(() => Insight)
  async rollBackChange(
    @Arg('gitHash') gitHash: string,
    @Arg('insightId', () => ID) insightId: string,
    @Ctx() ctx: Context,
    @Fields() fields: { Insight: { [str: string]: ResolveTree } }
  ): Promise<Insight> {
    logger.debug('Roll back to specific change', insightId);

    try {
      const [, dbInsightId] = fromGlobalId(insightId);
      const insight = (await getInsight(dbInsightId, this.getRequestedFields(fields))) as Insight;

      await this.changeHistoryService.rollBackToCommit(gitHash, ctx.user!, insight);

      // Force a sync of the repository to avoid showing the user un-synced data
      const updatedInsight = (await syncInsight({
        owner: insight.repository.owner.login,
        repo: insight.repository.externalName,
        repositoryType: RepositoryType.GITHUB,
        refresh: true,
        updated: true
      })) as Insight;

      return updatedInsight;
    } catch (error: any) {
      logger.error(error.message);
      logger.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  private getRequestedFields(fields: { Insight: { [str: string]: ResolveTree } }): string[] {
    const requestedFields = Object.keys(fields.Insight);
    return [...new Set([...requestedFields, 'insightId', 'fullName', 'contributors', 'repository'])];
  }
}
