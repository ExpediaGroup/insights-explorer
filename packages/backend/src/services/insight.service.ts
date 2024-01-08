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

import fs from 'fs';

import { CountResponse, SearchResponse, SearchBody } from '@iex/models/elasticsearch';
import { IndexedInsight } from '@iex/models/indexed/indexed-insight';
import { IndexedInsightCollaborator } from '@iex/models/indexed/indexed-insight-collaborator';
import { InsightFileAction } from '@iex/models/insight-file-action';
import { PersonType } from '@iex/models/person-type';
import { RepositoryPermission } from '@iex/models/repository-permission';
import { RepositoryType } from '@iex/models/repository-type';
import { sort } from '@iex/shared/dataloader-util';
import { getLogger } from '@iex/shared/logger';
import { Storage } from '@iex/shared/storage';
import { ApolloError } from 'apollo-server-express';
import DataLoader from 'dataloader';
import { raw } from 'objection';
import { Service } from 'typedi';

import {
  addCollaborator,
  archiveRepository,
  createIexWebhook,
  createRepository,
  doesRepositoryExist,
  getCollaborators,
  getRepositoryOwner,
  getRepositoryPermissions,
  removeCollaborator,
  updateRepository,
  updateTopics
} from '../lib/backends/github';
import {
  deleteInsight as deleteInsightFromElasticsearch,
  getInsight,
  getInsightByFullName as getInsightByFullNameFromElasticsearch,
  getInsights,
  defaultElasticsearchClient,
  ElasticIndex
} from '../lib/elasticsearch';
import { GitInstance } from '../lib/git-instance';
import { Activity, ActivityType, IndexedInsightActivityDetails } from '../models/activity';
import { GitHubCollaboratorAffiliation, GitHubRepository, RepositoryVisibility } from '../models/backends/github';
import { Comment } from '../models/comment';
import { Draft } from '../models/draft';
import { DbInsight, Insight, ValidateInsightName } from '../models/insight';
import { Repository } from '../models/repository';
import { User } from '../models/user';
import { UserInsight } from '../models/user-insight';
import { slugifyInsightName, incrementInsightName } from '../shared/slugify';
import { sleep } from '../shared/util';

import { ActivityService } from './activity.service';
import { UserService } from './user.service';

const logger = getLogger('insight.service');

@Service()
export class InsightService {
  // These fields will always be requested even if not included in _source args
  private requiredSourceFields = ['fullName'];

  private insightLoader: DataLoader<number, IndexedInsight> = new DataLoader(async (insightIds) => {
    logger.trace(`insightLoader with ${insightIds.length} IDs`);

    const result = await getInsights(insightIds as number[]);

    return sort(insightIds, result, 'insightId');
  });

  private commentCountById: DataLoader<number, number> = new DataLoader(async (insightIds) => {
    logger.trace(`commentCountById with ${insightIds.length} IDs`);

    const result = await Comment.query()
      .whereIn('insightId', insightIds as number[])
      .where('deleted_at', null)
      .groupBy('insightId')
      .count('* as commentCount')
      .select(['insightId']);

    return sort(insightIds, result, 'insightId').map((row) => row?.commentCount || 0);
  });

  private likeCountById: DataLoader<number, number> = new DataLoader(async (insightIds) => {
    logger.trace(`likeCountById with ${insightIds.length} IDs`);

    const result = await UserInsight.query()
      .whereIn('insightId', insightIds as number[])
      .where('liked', true)
      .groupBy('insightId')
      .count('* as likeCount')
      .select(['insightId']);

    return sort(insightIds, result, 'insightId').map((row) => row?.likeCount || 0);
  });

  private userInsightsById: DataLoader<{ insightId: number; userId: number }, UserInsight> = new DataLoader(
    async (tuples) => {
      logger.trace(`userInsightsById with ${tuples.length} IDs`);

      const existingUserInsights = await UserInsight.query().whereInComposite(
        ['insightId', 'userId'],
        tuples.map(({ insightId, userId }) => [insightId, userId])
      );

      return sort(tuples, existingUserInsights);
    }
  );

  private likedByLoader: DataLoader<number, number[]> = new DataLoader(async (insightIds) => {
    logger.trace(`likedByLoader with ${insightIds.length} IDs`);

    const result = await UserInsight.query()
      .whereIn('insightId', insightIds as number[])
      .where('liked', true)
      .groupBy('insightId')
      .select(['insightId', raw('array_agg(user_id) as "user_ids"')]);

    return sort(insightIds, result, 'insightId').map((row) => row?.userIds || []);
  });

  constructor(
    private readonly activityService: ActivityService,
    private readonly storage: Storage,
    private readonly userService: UserService
  ) {
    logger.trace('Constructing New Insight Service');
  }

  /**
   * Returns whether a user can edit an Insight (or not)
   *
   * @param insight Insight
   * @param user User
   */
  async canUserEdit(insight: Insight, user: User): Promise<boolean> {
    if (insight.repository?.isReadOnly === true) {
      return false;
    }

    if (user == null || user.githubPersonalAccessToken == null) {
      return false;
    }

    const permission = await this.getUserPermission(insight, user);

    if (permission !== null && ['ADMIN', 'WRITE'].includes(permission)) {
      return true;
    }

    return false;
  }

  /**
   * Returns a user's repository permission for an Insight.
   *
   * @param insight Insight
   * @param user User
   */
  async getUserPermission(insight: Insight, user: User): Promise<RepositoryPermission | null> {
    if (user == null || user.githubPersonalAccessToken == null) {
      return null;
    }

    const permission = await getRepositoryPermissions(
      insight.repository.owner.login,
      insight.repository.externalName,
      user.githubPersonalAccessToken!
    );

    switch (permission) {
      case 'ADMIN': {
        return RepositoryPermission.ADMIN;
      }
      case 'MAINTAIN':
      case 'WRITE': {
        return RepositoryPermission.WRITE;
      }
      default: {
        return RepositoryPermission.READ;
      }
    }
  }

  /**
   * Returns whether a user likes an Insight (or not)
   *
   * @param insightId Insight ID
   * @param user User
   */
  async doesUserLikeInsight(insightId: number, user: User): Promise<boolean> {
    if (user == null) {
      return false;
    }

    const userInsight = await this.userInsightsById.load({ insightId, userId: user.userId });

    return userInsight === null ? false : userInsight.liked;
  }

  /**
   * Fetches list of user IDs who have liked an Insight
   *
   * @param insightId Insight ID
   */
  async likedBy(insightId: number): Promise<number[]> {
    return this.likedByLoader.load(insightId);
  }

  /**
   * Fetches total number of comments for an Insight.
   *
   * @param insightId Insight ID
   */
  async commentCount(insightId: number): Promise<number> {
    return this.commentCountById.load(insightId);
  }

  /**
   * Fetches total number of likes for a Insight.
   *
   * @param insightId Insight ID
   */
  async likeCount(insightId: number): Promise<number> {
    return this.likeCountById.load(insightId);
  }

  async getViewCount(insightId: number): Promise<number> {
    const index = ElasticIndex.ACTIVITIES;
    const result = await defaultElasticsearchClient.count<CountResponse, SearchBody>({
      index,
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  activityType: 'VIEW_INSIGHT'
                }
              },
              {
                match: {
                  'details.insightId': insightId
                }
              }
            ]
          }
        }
      }
    });
    return result.body?.count;
  }

  /**
   * Fetch an Insight by ID
   *
   * @param insightId Insight ID
   */
  async getDbInsight(insightId: number): Promise<DbInsight> {
    const existingInsight = await DbInsight.query().where('insightId', insightId).first();

    if (existingInsight === undefined) {
      logger.error(`Unknown Insight: '${insightId}'`);
      throw new Error(`Unknown Insight: '${insightId}'`);
    }

    return existingInsight;
  }

  /**
   * Fetch an Insight by ID (from Elasticsearch)
   *
   * @param insightId Insight ID
   */
  async getInsight(insightId?: number): Promise<IndexedInsight | null> {
    //return getInsight(insightId);
    if (insightId == null) {
      return null;
    }

    return this.insightLoader.load(insightId);
  }

  /**
   * Fetch an Insight by full name (from Elasticsearch)
   */
  async getInsightByFullName(fullName: string, _source?: string[]): Promise<IndexedInsight | null> {
    return getInsightByFullNameFromElasticsearch(fullName, _source);
  }

  async validateInsightName(name: string, namespace: string): Promise<ValidateInsightName> {
    const slugifyName = slugifyInsightName(name);

    const index = ElasticIndex.INSIGHTS;
    const resultDisplayName = await defaultElasticsearchClient.search<SearchResponse<IndexedInsight>, SearchBody>({
      index,
      body: {
        query: {
          match: { 'name.keyword': name }
        }
      }
    });

    const { exists: repositoryExists } = await doesRepositoryExist(namespace, slugifyName);

    const result: ValidateInsightName = { isNameUnique: true, isFullNameUnique: true };
    if (resultDisplayName.body.hits.hits.length > 1) {
      result.isNameUnique = false;
      const doc = resultDisplayName.body.hits.hits[0];
      result.existingInsight = { ...doc._source } as Insight;
    }

    if (repositoryExists) {
      result.isFullNameUnique = false;
    }

    return result;
  }

  async isRepositoryMissing(repository: Repository): Promise<boolean> {
    if (repository.type === RepositoryType.FILE) {
      return !fs.existsSync(repository.externalId ?? repository.url);
    }

    try {
      // Fetch the latest readme from the GitHub API
      const { repository: repositoryExists, exists } = await doesRepositoryExist(
        repository.owner.login,
        repository.externalName
      );

      // We'll consider Archived repositories as missing since we'll want to
      // notify the user that the Insight is no longer active.
      if (!exists || repositoryExists?.isArchived) {
        return true;
      }

      return false;
    } catch (error: any) {
      logger.warn(`${error.errors[0].message}`);

      // Most likely the repository was deleted
      return true;
    }
  }

  /**
   * Create a new Insight.
   *
   * @param draft New Insight Draft
   * @param user User making the change
   */
  async createInsight(draft: Draft, user: User): Promise<Insight> {
    const { draftData } = draft;
    if (draftData.name == null) {
      throw new Error('Insight is missing a name');
    }

    // Use the requesting user's access token.
    const { githubPersonalAccessToken } = user;

    // GitHub repo names must conform to specific requirements
    // Manually convert instead of letting GitHub reformat the name
    let slugName = slugifyInsightName(draftData.name);

    // Use the default namespace if not provided
    if (draftData.namespace == null) {
      draftData.namespace = process.env.GITHUB_DEFAULT_ORG!;
    }

    logger.info(`Creating Insight: ${draftData.namespace}/${slugName}`);

    const owner = await getRepositoryOwner(draftData.namespace);

    // In case the repository already exists, increase the slug name to make it unique
    let { exists: repoExists } = await doesRepositoryExist(owner.login, slugName);
    while (repoExists) {
      logger.debug(`The respository name [${slugName}] already exists`);
      slugName = incrementInsightName(slugName);
      ({ exists: repoExists } = await doesRepositoryExist(owner.login, slugName));
    }
    logger.debug(`Repository name available [${slugName}]`);

    // Create Repository from scratch
    const repository = await createRepository(githubPersonalAccessToken!, {
      ownerId: owner.id,
      name: slugName,
      description: draftData.description,
      template: false,
      visibility: RepositoryVisibility.PUBLIC
    });

    // Wait to ensure the GitHub repo is ready
    await sleep(2500);

    await this.setupRepository(githubPersonalAccessToken!, repository);

    // Construct the bare minimum Insight required
    // We need to run the full sync to load everything
    const insight: Insight = {
      fullName: repository.nameWithOwner,
      repository: {
        cloneUrl: repository.cloneUrl,
        externalId: repository.id,
        externalName: repository.name,
        externalFullName: repository.nameWithOwner,
        isMissing: false,
        owner: {
          login: repository.owner.login
        }
      } as Repository,
      readme: {
        path: 'README.md'
      }
    } as Insight;

    // Commit draft changes to repository
    await this.updateInsight(insight, draft, user);

    return insight;
  }

  /**
   * Update an Insight.
   *
   * @param insight Original Insight
   * @param draft Updated Insight Draft
   * @param user User making the change
   */
  async updateInsight(insight: Insight, draft: Draft, user: User): Promise<void> {
    const { draftData, draftKey } = draft;
    const commitMessage = draftData.commitMessage!;
    const { githubPersonalAccessToken } = user;
    const { files, ...updatedYaml } = draftData;
    let mergedYaml = updatedYaml;

    logger.info(`Updating Insight: ${insight.fullName}`);

    // Convert all tags to lower case
    updatedYaml.tags = updatedYaml.tags?.map((tag) => tag.trim().toLowerCase().replaceAll(/\s/g, '-'));

    try {
      // Push changes to the git repository
      // 1) Update README.md
      // 2) Update `insight.yml`
      await GitInstance.applyGitChanges({
        gitUrl: insight.repository.cloneUrl,
        user,
        commitMessage,
        changes: [
          async (gitInstance) => {
            // Process any changes in files
            if (files != null) {
              logger.debug(`Processing ${files.length} files`);

              await Promise.all(
                files.map(async (file) => {
                  switch (file.action) {
                    // Add newly uploaded files
                    case InsightFileAction.ADD: {
                      logger.debug(`Adding new file: ${file.path}`);
                      const path = `drafts/${draftKey}/files/${file.id}`;
                      const readable = await this.storage.streamFile({ path });

                      return gitInstance.putFileFromStream(file.path!, readable);
                    }

                    // Add/modify existing file with inline content
                    case InsightFileAction.MODIFY: {
                      logger.debug(`Modifying file: ${file.path}`);

                      if (
                        file.originalPath &&
                        file.originalPath !== file.path &&
                        gitInstance.fileExists(file.originalPath)
                      ) {
                        // Rename file before modifying
                        await gitInstance.renameFile(file.originalPath, file.path);
                      }

                      return gitInstance.putFile(file.path!, file.contents!);
                    }

                    // Rename file only
                    case InsightFileAction.RENAME: {
                      logger.debug(`Renaming file: ${file.path}`);
                      if (file.originalPath) {
                        return gitInstance.renameFile(file.originalPath, file.path);
                      }
                      return;
                    }

                    // Delete file
                    case InsightFileAction.DELETE: {
                      logger.debug(`Deleting file: ${file.path}`);
                      return gitInstance.deleteFile(file.path);
                    }

                    case InsightFileAction.NONE:
                    default: {
                      return;
                    }
                  }
                })
              );
            }
          },
          async (gitInstance) => {
            // Update `insight.yml`
            logger.debug(`Updating insight.yml`);
            const insightYaml = await gitInstance.retrieveInsightYaml();

            // Merge the existing data with any fields specified in the update
            // This variable is hoisted so the merged version can be used to update
            // the GitHub API as well.
            const {
              authors,
              creation,
              description,
              excludedAuthors,
              itemType,
              links,
              metadata,
              name,
              tags,
              isUnlisted
            } = updatedYaml;
            mergedYaml = {
              ...insightYaml,
              name,
              description,
              itemType,
              links,
              tags,
              authors,
              excludedAuthors,
              isUnlisted
            };

            if (creation != null) {
              mergedYaml.creation = {
                ...insightYaml.creation,
                ...creation
              };
            }
            if (metadata != null) {
              mergedYaml.metadata = {
                ...insightYaml.metadata,
                ...metadata
              };

              if (mergedYaml.metadata?.team?.trim() === '') {
                delete mergedYaml.metadata.team;
              }
            }

            // Cleanup empty fields
            if (mergedYaml.links && mergedYaml.links.length === 0) {
              delete mergedYaml.links;
            }
            if (mergedYaml.authors && mergedYaml.authors.length === 0) {
              delete mergedYaml.authors;
            }
            if (mergedYaml.excludedAuthors && mergedYaml.excludedAuthors.length === 0) {
              delete mergedYaml.excludedAuthors;
            }

            if (mergedYaml) await gitInstance.putInsightYaml(mergedYaml);
          }
        ]
      });
    } catch (error: any) {
      if (error.code === 'HttpError') {
        if (error.caller === 'git.push') {
          throw new ApolloError(error.data.response, 'GIT_PUSH_PERMISSION');
        } else if (error.caller === 'git.clone' && error.data.statusCode === 401) {
          throw new ApolloError(error.data.response, 'GIT_CLONE_PERMISSION');
        }
      }

      throw error;
    }

    // GitHub API updates
    logger.debug(`Updating GitHub repository (${insight.repository.externalId})`);
    try {
      if (mergedYaml.description != null) {
        await updateRepository(githubPersonalAccessToken!, {
          repositoryId: insight.repository.externalId,
          description: mergedYaml.description
        });
      }
      if (mergedYaml.tags != null) {
        await updateTopics(githubPersonalAccessToken!, {
          repositoryId: insight.repository.externalId,
          topicNames: mergedYaml.tags
        });
      }
    } catch (error: any) {
      // Eat any exceptions since keeping GitHub in sync is not required
      logger.error(`Unable to update GitHub repository: ${insight.repository.externalFullName}`);
      logger.error(JSON.stringify(error, null, 2));
    }
  }

  /**
   * Toggles liked from a user to an Insight.
   *
   * @param insightId Insight ID
   * @param liked Indicates whether liked is being added or removed
   * @param user User making the change
   */
  async likeInsight(insightId: number, liked: boolean, user: User): Promise<DbInsight> {
    const existingInsight = await this.getDbInsight(insightId);

    const existingUserInsight = await UserInsight.query()
      .where('insightId', insightId)
      .where('userId', user.userId)
      .first();

    await (existingUserInsight == null
      ? UserInsight.query().insert({
          insightId,
          userId: user.userId,
          liked
        })
      : existingUserInsight.$query().patchAndFetch({ liked }));

    const activityType = liked ? ActivityType.LIKE_INSIGHT : ActivityType.UNLIKE_INSIGHT;

    this.activityService.recordActivity(activityType, user, {
      insightId: existingInsight.insightId,
      insightName: existingInsight.insightName
    });

    // Increment `likeCount` for the Insight
    await defaultElasticsearchClient.update({
      id: insightId.toString(),
      index: ElasticIndex.INSIGHTS,
      body: {
        script: {
          source: 'ctx._source.likeCount += params.count',
          params: {
            count: liked ? 1 : -1
          }
        }
      }
    });

    return existingInsight;
  }

  /**
   * Records a view of an Insight
   *
   * @param insightId Insight ID
   * @param user User making the change
   */
  async viewInsight(details: IndexedInsightActivityDetails, user: User): Promise<Activity> {
    const activityId = await this.activityService.recordActivity(ActivityType.VIEW_INSIGHT, user, details);

    // Increment `viewCount` for the Insight
    await defaultElasticsearchClient.update({
      id: details.insightId.toString(),
      index: ElasticIndex.INSIGHTS,
      body: {
        script: {
          source: 'ctx._source.viewCount += params.count',
          params: {
            count: 1
          }
        }
      }
    });

    const activity = await this.activityService.getActivity(activityId!);
    return activity;
  }

  /**
   * Deletes an Insight
   *
   * @param insightId Insight ID
   * @param user User making the change
   * @param hard True for a hard delete, false for a soft delete (default)
   */
  async deleteInsight(insightId: number, archiveRepo: boolean, user: User, hard = false): Promise<DbInsight> {
    if (hard === true) {
      throw new Error('Hard deletes of Insights are not yet supported.');
    }

    const existingInsight = await this.getDbInsight(insightId);

    if (existingInsight.deletedAt != null) {
      throw new Error('Insight is already deleted');
    }

    const insight = await getInsight(insightId);
    const isMissing = await this.isRepositoryMissing(insight!.repository);

    if (!isMissing && archiveRepo) {
      // Archive GitHub repository
      await archiveRepository(user.githubPersonalAccessToken!, existingInsight.externalId);
    }

    // Remove from Elasticsearch index
    await deleteInsightFromElasticsearch(insightId);

    // Update deletedAt field on existing row
    const dbInsight = await existingInsight.$query().patchAndFetch({ deletedAt: DbInsight.knex().fn.now() });

    this.activityService.recordActivity(ActivityType.DELETE_INSIGHT, user, {
      insightId: existingInsight.insightId,
      insightName: existingInsight.insightName
    });

    return dbInsight;
  }

  /**
   * Gets Collaborators for an Insight
   */
  async getCollaborators(
    insight: Insight,
    affiliation: GitHubCollaboratorAffiliation = 'DIRECT'
  ): Promise<IndexedInsightCollaborator[]> {
    if (insight.repository.type === RepositoryType.FILE) {
      return [];
    }

    const gitHubCollaborators = await getCollaborators(
      insight.repository.owner.login,
      insight.repository.externalName,
      affiliation
    );
    if (gitHubCollaborators == null || gitHubCollaborators.length === 0) {
      return [];
    }

    gitHubCollaborators.forEach((collaborator: any) => {
      logger.debug(`Collaborator: ${JSON.stringify(collaborator, null, 2)}`);
    });

    return await Promise.all(
      gitHubCollaborators
        .filter((edge) => {
          // Ignore the IEX Service Account
          return edge.node.login !== process.env.GITHUB_SERVICE_ACCOUNT;
        })
        .filter((edge) => {
          // Ignore READ permissions
          return edge.permission !== 'READ';
        })
        .map(async ({ node, permission }) => {
          const user = await this.userService.getUserByGitHubLogin(node.login);
          if (user === null) {
            // This means we detected a GitHub user who isn't an IEX user.
            // Make do with what we have
            return {
              user: {
                userId: `unknown:${node.login}`,
                userName: node.login,
                displayName: node.login,
                email: 'unknown',
                gitHubUser: {
                  login: node.login,
                  type: PersonType.USER,
                  externalId: node.id
                }
              } as unknown as User,
              permission: permission as RepositoryPermission
            };
          }

          return {
            user: {
              userId: user.userId,
              userName: user.userName,
              email: user.email,
              displayName: user.displayName,
              avatar: user.avatar,
              gitHubUser: {
                login: node.login,
                type: PersonType.USER,
                avatarUrl: node.avatarUrl,
                externalId: node.id
              }
            },
            permission: permission as RepositoryPermission
          };
        })
    );
  }

  /**
   * Adds a collaborator to an Insight
   *
   * @param insight Insight
   * @param collaborator User to add as a collaborator
   * @param user User making the change
   */
  async addCollaborator(
    insight: Insight,
    collaborator: User,
    user: User,
    permission?: RepositoryPermission
  ): Promise<void> {
    if (collaborator.githubProfile?.login === undefined) {
      throw new Error('Cannot add collaborators without a GitHub login');
    }

    const perm = (() => {
      switch (permission) {
        case undefined: {
          return;
        }
        case 'ADMIN': {
          return 'admin';
        }
        case 'READ': {
          return 'pull';
        }
        default: {
          return 'push';
        }
      }
    })();

    await addCollaborator(
      user.githubPersonalAccessToken!,
      insight.repository.owner.login,
      insight.repository.externalName,
      collaborator.githubProfile!.login!,
      perm
    );

    this.activityService.recordActivity(ActivityType.ADD_COLLABORATOR, user, {
      userId: collaborator.userId,
      insightId: insight.insightId,
      permission
    });

    logger.debug(`Added collaborator ${collaborator.githubProfile!.login!} to ${insight.fullName}`);
  }

  /**
   * Removes collaborator from an Insight
   *
   * @param insight Insight
   * @param collaborator User to add as a collaborator
   * @param user User making the change
   */
  async removeCollaborator(insight: Insight, collaborator: User, user: User): Promise<void> {
    if (collaborator.githubProfile?.login === undefined) {
      throw new Error('Cannot add collaborators without a GitHub login');
    }

    await removeCollaborator(
      user.githubPersonalAccessToken!,
      insight.repository.owner.login,
      insight.repository.externalName,
      collaborator.githubProfile!.login!
    );

    this.activityService.recordActivity(ActivityType.REMOVE_COLLABORATOR, user, {
      userId: collaborator.userId,
      insightId: insight.insightId,
      permission: 'NONE'
    });

    logger.debug(`Removed collaborator ${collaborator.githubProfile!.login!} from ${insight.fullName}`);
  }

  /**
   * Apply IEX settings to repository
   *
   * @param token GitHub token
   * @param repository Repository
   */
  private async setupRepository(token: string, repository: GitHubRepository): Promise<void> {
    // Add IEX service account collaborator
    // TODO: We can lookup the GITHUB_SERVICE_ACCOUNT from the GITHUB_ACCESS_TOKEN value using the `viewer` query
    await addCollaborator(token, repository.owner!.login, repository.name, process.env.GITHUB_SERVICE_ACCOUNT!);

    if (process.env.GITHUB_USE_WEBHOOK === 'true') {
      // Add IEX webhook
      await createIexWebhook(token, repository.owner!.login, repository.name);
    }
  }
}
