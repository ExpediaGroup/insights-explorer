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
import { AWSError } from 'aws-sdk';
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

  const response = getFromS3(key, range);

  response
    .on('httpHeaders', function (code, headers) {
      if (code < 300) {
        res.set('Accept-Ranges', headers['accept-ranges']);
        res.set('Content-Length', headers['content-length']);

        // res.set('Content-Type', headers['content-type']);
        res.contentType(getType(filePath));

        if (range) {
          res.set('Content-Range', headers['content-range']);
          res.status(206); // Partial Content success
        }
      }
    })
    .createReadStream()
    .on('error', (error: AWSError) => {
      if (error.code == 'NoSuchKey') {
        res.status(404).send();
      } else {
        logger.error('S3 error: ' + error);
        res.status(500).send(error);
      }
    })
    .pipe(res);
};
