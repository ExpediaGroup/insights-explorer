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
import path from 'path';

import type { ConvertibleFile, ConvertRequest } from '@iex/models/convertbot/convert-request';
import { MessageQueue } from '@iex/mq/message-queue';
import { getLogger } from '@iex/shared/logger';
import { Storage } from '@iex/shared/storage';
import * as tmp from 'tmp-promise';

const logger = getLogger('convertbot');

export type ConversionMapping = {
  from: string;
  to: string;
  apply: (source: string) => Promise<string[]>;
};

export class Convertbot {
  private conversionMq: MessageQueue;
  private conversionMappings: ConversionMapping[] = [];

  constructor() {
    this.conversionMq = new MessageQueue({ region: process.env.S3_REGION, queueUrl: process.env.CONVERSION_SQS_URL });
  }

  registerMapping(newMapping: ConversionMapping): void {
    const existingMappingIndex = this.conversionMappings.findIndex((m) => {
      return m.from === newMapping.from && m.to === newMapping.to;
    });

    if (existingMappingIndex >= 0) {
      logger.warn(
        `A conversion mapping from '${newMapping.from}' to '${newMapping.to}' already exists and will be overwritten!`
      );
      this.conversionMappings.splice(existingMappingIndex, 1);
    }

    logger.info(`Registering a new mapping from '${newMapping.from}' to '${newMapping.to}'`);
    this.conversionMappings.push(newMapping);
  }

  registerMappings(...newMappings: ConversionMapping[]): void {
    newMappings.forEach(this.registerMapping.bind(this));
  }

  start(): void {
    this.conversionMq.consumeMessages(async (request: ConvertRequest) => {
      logger.info(`Conversion request for ${request.source.uri} to ${request.targets.length} targets`);

      await tmp.withDir(
        async ({ path: tempPath }) => {
          logger.debug(`Using temporary path: ${tempPath}`);

          try {
            // Download source file
            const localSourcePath = path.join(tempPath, path.basename(request.source.uri));
            await this.downloadFile(request.source.uri, localSourcePath);

            // Iterate through targets (one at a time)
            for (let i = 0; i < request.targets.length; i++) {
              const target = request.targets[i];
              const targetBase = target.uri.slice(0, Math.max(0, target.uri.lastIndexOf('/')));

              logger.info(`Starting conversion for ${request.source.uri} to ${target.mimeType}`);
              const localTargetPaths = await this.convert(request.source, target, localSourcePath);
              logger.debug('Converted files: ' + localTargetPaths.join(', '));

              for (const [j, localTargetPath] of localTargetPaths.entries()) {
                logger.debug(`Uploading file from: ${localTargetPath}`);

                // This is basically a hack to support generating multiple files from a single source
                // For things like PPTX slide images, IEX doesn't know how many files will be generated, so
                // it cannot provide a target URI for each file.
                //
                // The first localTargetPath will be uploaded to the original target URI, and the rest will be
                // uploaded to the localTargetPath basename, in the target URI directory.
                const targetUri = j === 0 ? target.uri : `${targetBase}/${path.basename(localTargetPath)}`;

                await this.uploadFile(targetUri, localTargetPath);
                logger.info(`Uploaded file to: ${target.uri}`);
              }
            }
          } catch (error: any) {
            logger.error(`Error in conversion: ${error}`);
          }
        },
        { unsafeCleanup: true }
      );

      logger.info('Request completed!');
    });
  }

  private async downloadFile(uri: string, localPath: string): Promise<void> {
    const storage = new Storage();
    const sourceReadable = await storage.streamFile({ uri });

    return new Promise((resolve, reject) => {
      const sourceWriteable = fs.createWriteStream(localPath);

      sourceReadable
        .on('error', (e) => {
          logger.error(`Error downloading file: ${e}`);
          reject(e);
        })
        .pipe(sourceWriteable)
        .on('finish', resolve);
    });
  }

  private async convert(source: ConvertibleFile, target: ConvertibleFile, localSourcePath: string): Promise<string[]> {
    logger.info(`Converting from ${source.mimeType} to ${target.mimeType}`);

    const mapping = this.conversionMappings.find((m) => {
      return m.from === source.mimeType && m.to === target.mimeType;
    });

    if (mapping === undefined) {
      logger.error(`Unsupported source/target MIME types! Unable to convert (${source.mimeType},  ${target.mimeType})`);
      throw new Error('Unable to convert');
    }

    return await mapping.apply(localSourcePath);
  }

  private async uploadFile(uri: string, localPath: string): Promise<void> {
    const storage = new Storage();
    const readStream = fs.createReadStream(localPath);

    await storage.writeFile({ uri, stream: readStream });
  }
}
