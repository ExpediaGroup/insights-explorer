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

import type { Readable } from 'stream';

import { S3 } from 'aws-sdk';
import type { ReadStream } from 'fs-extra';

import logger from '@iex/shared/logger';

export type StorageOptions = S3.Types.ClientConfiguration;

export interface StorageUriOptions {
  uri?: string;
  bucket?: string;
  path?: string;
}

export type StorageWriteOptions = StorageUriOptions & {
  body?: Buffer | string;
  fileSize?: number;
  stream?: ReadStream;
};

export type StorageReadOptions = StorageUriOptions;

const defaultOptions: S3.Types.ClientConfiguration = {
  region: process.env.S3_REGION,
  maxRetries: 3
};

/**
 * This is a custom wrapper around S3's SDK that aims to make it easier
 * to use for IEX purposes.  It could also serve as the foundation for an
 * abstraction layer across multiple storage engines, if needed.
 */
export class Storage {
  private s3: S3;

  constructor(readonly options: StorageOptions = defaultOptions) {
    this.s3 = new S3({ ...defaultOptions, ...options });
  }

  static toUri(bucket: string, path: string): string {
    return `s3://${bucket}/${path}`;
  }

  static parseUri(uri: string): { bucket: string; path: string } {
    if (uri.startsWith('s3://')) {
      const parts = uri.match(/s3:\/\/(?<bucket>[^/]*)\/(?<key>.*)/);
      if (parts && parts.length >= 3) {
        return { bucket: parts[1], path: parts[2] };
      }
    }

    throw new Error('Unable to parse URI: ' + uri);
  }

  static normalizeUriOptions(options: StorageUriOptions): Required<StorageUriOptions> {
    let { bucket, path, uri } = options;
    if (uri === undefined) {
      if (bucket === undefined) {
        bucket = process.env.S3_BUCKET;
      }

      if (bucket === undefined || path === undefined) {
        throw new Error('Either uri or bucket/path options must be set.');
      }

      uri = Storage.toUri(bucket, path);
    } else {
      const parsed = Storage.parseUri(uri);
      bucket = parsed.bucket;
      path = parsed.path;
    }

    return { bucket, path, uri };
  }

  /**
   * Writes a string, Buffer, or ReadStream
   */
  async writeFile(options: StorageWriteOptions): Promise<string> {
    const { bucket, path, uri } = Storage.normalizeUriOptions(options);
    const { body, fileSize, stream } = options;

    if (body !== undefined) {
      const response = await this.s3.putObject({ Body: body, Bucket: bucket, Key: path }).promise();
      logger.debug(`[STORAGE] S3 file successfully uploaded with Etag: ${response.ETag} and URI: ${uri}`);
    } else if (stream !== undefined) {
      const uploadOptions: S3.PutObjectRequest = { Body: stream, Bucket: bucket, Key: path };

      if (fileSize !== undefined) {
        uploadOptions.ContentLength = fileSize;
      }

      const response = await this.s3.upload(uploadOptions).promise();
      logger.debug(`[STORAGE] S3 file successfully streamed with Etag: ${response.ETag} and URI: ${uri}`);
    } else {
      throw new Error('Either body or stream options must be set.');
    }

    return uri;
  }

  /**
   * Returns a data stream of a file
   */
  async streamFile(options: StorageReadOptions): Promise<Readable> {
    const { bucket, path, uri } = Storage.normalizeUriOptions(options);

    logger.debug(`[STORAGE] Streaming from ${uri}`);
    const response = this.s3.getObject({ Bucket: bucket, Key: path }).createReadStream();

    return response;
  }

  /**
   * Checks if a file exists and returns true/false.
   */
  async exists(options: StorageReadOptions): Promise<boolean> {
    const { bucket, path, uri } = Storage.normalizeUriOptions(options);

    logger.debug(`[STORAGE] Checking existance of ${uri}`);
    try {
      await this.s3.headObject({ Bucket: bucket, Key: path }).promise();
      return true;
    } catch (error: any) {
      if (error.code == 'NotFound') return false;
      throw error;
    }
  }
}
