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

import { Readable } from 'node:stream';

import { NoSuchKey } from '@aws-sdk/client-s3';
import { getLogger } from '@iex/shared/logger';
import { Response, Request } from 'express';

import { getFromS3, headFromS3 } from '../lib/storage';
import { getType } from '../shared/mime';

const logger = getLogger('insights.v1');

/**
 * HEAD /insights/:namespace/:name/assets/:filepath
 */
export const headInsightFile = async (req: Request, res: Response): Promise<void> => {
  const filePath = req.params.filepath + req.params[0];
  const key = `insights/${req.params.namespace}/${req.params.name}/files/${filePath}`;

  logger.debug(`Attempting to HEAD insight attachment: ${filePath}`);

  const headObject = await headFromS3(key);

  if (headObject === undefined) {
    res.status(404);
    return;
  }

  res.set('Accept-Ranges', headObject.AcceptRanges);
  res.set('Content-Length', headObject.ContentLength?.toString());

  // res.set('Content-Type', headObject.ContentType);
  res.contentType(getType(filePath));

  res.send();
};

/**
 * GET /insights/:namespace/:name/assets/:filepath
 */
export const getInsightFile = async (req: Request, res: Response): Promise<void> => {
  const filePath = req.params.filepath + req.params[0];
  const key = `insights/${req.params.namespace}/${req.params.name}/files/${filePath}`;

  logger.debug(`Attempting to load insight attachment: ${filePath}`);

  const range = Array.isArray(req.headers['range']) ? req.headers['range'][0] : req.headers['range'];

  try {
    const response = await getFromS3(key, range);

    if (response.AcceptRanges) {
      res.set('Accept-Ranges', response.AcceptRanges);
    }
    if (response.ContentLength) {
      res.set('Content-Length', response.ContentLength.toString());
    }

    //res.set('Content-Type', response.ContentType);
    res.contentType(getType(filePath));

    if (range) {
      res.set('Content-Range', response.ContentRange);
      res.status(206);
    }

    if (response.Body) {
      (response.Body as Readable).pipe(res);
    }
  } catch (error) {
    if (error instanceof NoSuchKey) {
      res.status(404).send();
    } else {
      res.status(500).send(error);
    }
  }
};
