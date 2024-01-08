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

import path from 'path';

import { getLogger } from '@iex/shared/logger';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { nanoid } from 'nanoid';
import { Arg, Authorized, Ctx, Mutation, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { Context } from '../models/context';
import { DraftKey } from '../models/draft';
import { InsightFile, InsightFileUploadInput } from '../models/insight-file';
import { Permission } from '../models/permission';
import { AvatarUploadResult } from '../models/user';
import { AttachmentService } from '../services/attachment.service';
import { getTypeAsync } from '../shared/mime';

const logger = getLogger('attachment.resolver');

@Service()
@Resolver()
export class AttachmentResolver {
  constructor(private readonly attachmentService: AttachmentService) {
    logger.trace('Constructing New Attachment Resolver');
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => InsightFile)
  async uploadSingleFile(
    @Arg('draftKey') draftKey: DraftKey,
    @Arg('attachment') attachment: InsightFileUploadInput,
    @Arg('file', () => GraphQLUpload) file: FileUpload
  ): Promise<InsightFile> {
    const { createReadStream, filename } = await file;
    logger.debug(filename);
    logger.debug(JSON.stringify(file, null, 2));

    try {
      const uri = await this.attachmentService.uploadToDraft(draftKey, attachment, createReadStream());
      logger.debug('Wrote stream to S3: ' + uri);

      // Detect the mimeType of the attachment
      const stream = await this.attachmentService.streamFromDraft(draftKey, attachment);
      const mimeType = await getTypeAsync({ fileName: file.filename, stream });

      return {
        ...attachment,
        mimeType,
        name: attachment.name ?? file.filename,
        path: attachment.path ?? file.filename
      };
    } catch (error: any) {
      logger.error(error);
      throw error;
    }
  }

  @Authorized<Permission>({ user: true })
  @Mutation(() => AvatarUploadResult)
  async uploadUserAvatar(
    @Ctx() ctx: Context,
    @Arg('size') size: number,
    @Arg('file', () => GraphQLUpload) file: FileUpload
  ): Promise<AvatarUploadResult> {
    const { createReadStream, filename } = await file;
    logger.debug(filename);
    logger.debug(JSON.stringify(file, null, 2));

    const key = this.newAvatarKey() + path.extname(filename);
    try {
      const uri = await this.attachmentService.uploadAvatar(key, size, createReadStream());
      logger.debug('Wrote stream to S3: ' + uri);

      return {
        avatar: key,
        avatarUrl: `${process.env.PUBLIC_URL}/api/v1/avatars/${key}`
      };
    } catch (error: any) {
      logger.error(error);
      throw error;
    }
  }

  private newAvatarKey(): string {
    return nanoid();
  }
}
