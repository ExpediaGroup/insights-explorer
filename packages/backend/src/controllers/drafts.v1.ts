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

import { NoSuchKey } from '@aws-sdk/client-s3';
import { getLogger } from '@iex/shared/logger';
import { Storage } from '@iex/shared/storage';
import { Response, Request } from 'express';
import Container from 'typedi';

const logger = getLogger('drafts.v1');

/**
 * GET /drafts/:draftKey/assets/:attachmentKey?content-type=
 */
export const getDraftAttachment = async (req: Request, res: Response): Promise<void> => {
  const draftKey = `drafts/${req.params.draftKey}/files/${req.params.attachmentKey}`;
  logger.debug(`Attempting to load draft attachment: ${draftKey}, ${req.params.attachmentKey}`);

  try {
    const storage = Container.get(Storage);
    const readable = await storage.streamFile({ path: draftKey });

    if (req.query['content-type']) {
      res.contentType(req.query['content-type'] as string);
    }

    readable.pipe(res);
  } catch (error) {
    if (error instanceof NoSuchKey) {
      res.status(404).send();
    } else {
      res.status(500).send(error);
    }
  }
};
