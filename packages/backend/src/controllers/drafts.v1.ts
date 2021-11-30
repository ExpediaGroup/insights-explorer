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

import logger from '@iex/shared/logger';
import { AWSError } from 'aws-sdk';
import { Response, Request } from 'express';

import { streamFromS3 } from '../lib/storage';

/**
 * GET /drafts/:draftKey/assets/:attachmentKey?content-type=
 */
export const getDraftAttachment = async (req: Request, res: Response): Promise<void> => {
  const draftKey = `drafts/${req.params.draftKey}/files/${req.params.attachmentKey}`;
  logger.debug(`[DRAFTS.V1] Attempting to load draft attachment: ${draftKey}, ${req.params.attachmentKey}`);

  const readable = await streamFromS3(draftKey);
  readable.on('error', (error: AWSError) => {
    if (error.code == 'NoSuchKey') {
      res.status(404).send();
    } else {
      res.status(500).send(error);
    }
  });

  if (req.query['content-type']) {
    res.contentType(req.query['content-type'] as string);
  }

  readable.pipe(res);
};
