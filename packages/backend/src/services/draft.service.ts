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

import { IndexedInsight } from '@iex/models/indexed/indexed-insight';
import { InsightFileAction } from '@iex/models/insight-file-action';
import { ItemType } from '@iex/models/item-type';
import { getLogger } from '@iex/shared/logger';
import { Storage } from '@iex/shared/storage';
import { nanoid } from 'nanoid';
import pMap from 'p-map';
import { Service } from 'typedi';

import { DraftKey } from '../models/draft';
import { Draft, DraftInput } from '../models/draft';
import { User } from '../models/user';
import { AttachmentService } from '../services/attachment.service';
import { TemplateService } from '../services/template.service';
import { fromGlobalId } from '../shared/resolver-utils';

const logger = getLogger('draft.service');

@Service()
export class DraftService {
  constructor(
    private readonly attachmentService: AttachmentService,
    private readonly storage: Storage,
    private readonly templateService: TemplateService
  ) {
    logger.trace('[DRAFT.SERVICE] Constructing New Draft Service');
  }

  newDraftKey(): string {
    return nanoid();
  }

  /**
   * Fetch drafts for a user (optionally for a specific Insight)
   *
   * @param userId User ID
   * @param insightId Insight ID
   *    undefined: include all drafts for user;
   *    null: filter for Drafts without an Insight (e.g. new Insights)
   *    else: filter for Drafts with a specific Insight ID
   */
  async getDraftsForUser(userId: number, insightId?: number | null): Promise<Draft[]> {
    let query = Draft.query().where('createdByUserId', userId).orderBy('updatedAt', 'desc');

    if (insightId !== undefined) {
      query = query.where('insightId', insightId);
    }

    const drafts = await query;

    return drafts;
  }

  /**
   * Fetches a draft
   *
   * @param draftKey Draft Key
   */
  async getDraft(draftKey: DraftKey): Promise<Draft> {
    const existingDraft = await Draft.query().where('draftKey', draftKey).first();

    if (existingDraft === undefined) {
      throw new Error('Draft not found by key: ' + draftKey);
    }

    return existingDraft;
  }

  /**
   * Create a new Draft, or updates an existing one.
   *
   * @param draft Draft
   * @param user User making the change
   */
  async upsertDraft(draft: DraftInput, user: User | null): Promise<Draft> {
    const existingDraft = await Draft.query().where('draftKey', draft.draftKey).first();

    const insightId = draft.insightId;
    const draftRemains: Partial<Draft> = {
      ...draft,
      insightId: undefined
    };

    if (insightId) {
      // Convert from string ID to database ID
      const [, dbInsightId] = fromGlobalId(insightId);
      draftRemains.insightId = dbInsightId;
    }

    if (existingDraft == undefined) {
      logger.trace('Draft does not exist in database');
      return await Draft.query().insert({
        ...draftRemains,
        createdByUserId: user?.userId
      });
    } else {
      logger.trace('Draft does exist in database');
      return await existingDraft.$query().patchAndFetch(draftRemains);
    }
  }

  /**
   * Deletes a draft
   *
   * @param draft Draft
   * @param user User making the change
   */
  async deleteDraft(draftKey: DraftKey, user: User): Promise<Draft> {
    const existingDraft = await Draft.query().where('draftKey', draftKey).first();

    if (existingDraft == undefined) {
      throw new Error('Draft not found by key: ' + draftKey);
    } else {
      if (existingDraft.createdByUserId != user.userId && existingDraft.createdByUserId != null) {
        throw new Error('Not allowed');
      }

      logger.trace('Draft does exist in database');
      const count = await existingDraft.$query().delete();
      if (count !== 1) {
        throw new Error('Unexpectedly, Draft not deleted');
      }
      return existingDraft;
    }
  }

  /**
   * Create a new Draft.
   *
   * @param user User
   * @param itemType Optional item type, defaults to Insight
   * @param draftKey Optional draft key, defaults to a new one
   */
  async createDraft(user: User, draftKey = nanoid(), itemType = ItemType.INSIGHT): Promise<Draft> {
    logger.info(`Creating a new Draft (${itemType})`);

    const draft: DraftInput = {
      draftKey,
      draftData: {
        commitMessage: `Initial commit`,
        namespace: process.env.GITHUB_DEFAULT_ORG,
        name: '',
        tags: [],
        itemType,
        files: [
          {
            id: nanoid(),
            action: InsightFileAction.MODIFY,
            name: 'README.md',
            path: 'README.md',
            mimeType: 'text/markdown',
            contents: ''
          }
        ]
      }
    };

    if (user.defaultTemplate) {
      // Apply user's default template to the draft initially
      return this.applyTemplateToDraft(draft, user.defaultTemplate, user);
    } else {
      const upserted = await this.upsertDraft(draft, user);

      if (upserted.updatedAt == null) {
        upserted.updatedAt = new Date();
      }

      return upserted;
    }
  }

  /**
   * Updates a draft with the contents of a template.
   *
   * @param draftKey Draft key
   * @param templateId Template ID
   * @param user User
   */
  async applyTemplateToDraft(draft: DraftInput, templateId: number, user: User): Promise<Draft> {
    if (draft == null) {
      throw new Error('Draft not found');
    }

    logger.info(`Applying template to Draft (${draft.draftKey})`);

    // Load Template
    const template = await this.templateService.getTemplate(templateId);

    if (template == null) {
      throw new Error('Template not found');
    }

    // Copy template metadata to draft
    draft.draftData = {
      ...draft.draftData,
      tags: template.tags,
      creation: {
        template: template.fullName
      }
    };

    if (template.files) {
      draft.draftData.files = await pMap(
        template.files,
        async (file) => {
          // Copy each file from the template
          // and upload to the draft
          const path = `insights/${template.fullName}/files/${file.path}`;
          const readable = await this.storage.streamFile({ path });

          // Duplicate file with new ID and 'add' action
          const newFile = {
            ...file,
            action: InsightFileAction.ADD,
            originalPath: file.path,
            id: nanoid()
          };

          // Upload original file into the draft
          await this.attachmentService.uploadToDraft(draft.draftKey, newFile, readable);

          return newFile;
        },
        { concurrency: 5 }
      );
    }

    const upserted = await this.upsertDraft(draft, user);

    if (upserted.updatedAt == null) {
      upserted.updatedAt = new Date();
    }

    return upserted;
  }

  /**
   * Clone an existing Insight into a new Draft.
   *
   * @param sourceInsight Source Insight
   */
  async cloneInsight(sourceInsight: IndexedInsight, user: User): Promise<Draft> {
    logger.info(`Cloning ${sourceInsight.fullName} into a new Draft`);

    const draftKey = nanoid();
    const draft: DraftInput = {
      draftKey,
      draftData: {
        commitMessage: `Cloned from ${sourceInsight.fullName}`,
        namespace: process.env.GITHUB_DEFAULT_ORG,
        name: `${sourceInsight.name} - clone`,
        description: sourceInsight.description,
        tags: sourceInsight.tags,
        itemType: sourceInsight.itemType,
        files: [],
        creation: {
          clonedFrom: sourceInsight.fullName
        }
      }
    };

    if (sourceInsight.files) {
      draft.draftData.files = await pMap(
        sourceInsight.files,
        async (file) => {
          // Copy each file from the source insight
          // and upload to the draft
          const path = `insights/${sourceInsight.fullName}/files/${file.path}`;
          const readable = await this.storage.streamFile({ path });

          // Duplicate file with new ID and 'add' action
          const newFile = {
            ...file,
            action: InsightFileAction.ADD,
            originalPath: file.path,
            id: nanoid()
          };

          // Upload original file into the draft
          await this.attachmentService.uploadToDraft(draftKey, newFile, readable);

          return newFile;
        },
        { concurrency: 5 }
      );
    }

    const upserted = await this.upsertDraft(draft, user);

    if (upserted.updatedAt == null) {
      upserted.updatedAt = new Date();
    }

    return upserted;
  }
}
