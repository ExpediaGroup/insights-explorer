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

import { ReadStream } from 'fs';

import { Service } from 'typedi';

import { streamFromS3, streamToS3 } from '../lib/storage';
import { InsightFile } from '../models/insight-file';

@Service()
export class AttachmentService {
  getAvatarPath(avatarKey: string): string {
    return `avatars/${avatarKey}`;
  }

  getDraftAttachmentPath(draftKey: string, attachment: Partial<InsightFile>): string {
    return `drafts/${draftKey}/files/${attachment.id}`;
  }

  uploadAvatar(avatarKey: string, size: number, readStream: ReadStream): Promise<string> {
    return streamToS3(readStream, size, this.getAvatarPath(avatarKey));
  }

  uploadToDraft(draftKey: string, attachment: Partial<InsightFile>, readStream: ReadStream): Promise<string> {
    return streamToS3(readStream, attachment.size!, this.getDraftAttachmentPath(draftKey, attachment));
  }

  streamFromDraft(draftKey: string, attachment: Partial<InsightFile>): Promise<ReadStream> {
    return streamFromS3(this.getDraftAttachmentPath(draftKey, attachment));
  }
}
