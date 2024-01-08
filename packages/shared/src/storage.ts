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

import type {
  S3ClientConfig,
  GetObjectCommandOutput,
  PutObjectCommandInput,
  HeadObjectCommandOutput
} from '@aws-sdk/client-s3';
import { GetObjectCommand, HeadObjectCommand, NotFound, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { getLogger } from '@iex/shared/logger';

export type StorageOptions = S3ClientConfig;

export interface RequiredStorageUriOptions {
  uri: string;
  bucket: string;
  path: string;
}

export interface OptionalStorageUriOptions {
  range?: string;
}

export type StorageUriOptions = Partial<RequiredStorageUriOptions> & OptionalStorageUriOptions;

export type StorageWriteOptions = StorageUriOptions & {
  body?: Buffer | string;
  fileSize?: number;
  stream?: Readable;
};

export type StorageReadOptions = StorageUriOptions;

export type NormalizedStorageUriOptions = StorageUriOptions & RequiredStorageUriOptions;

const defaultOptions: S3ClientConfig = {
  region: process.env.S3_REGION,
  maxAttempts: 4,

  endpoint: process.env.S3_ENDPOINT === '' ? undefined : process.env.S3_ENDPOINT,

  // S3 Path-style requests are deprecated
  // But some S3-compatible APIs may use them (e.g. Minio)
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' ? true : undefined
};

/**
 * This is a custom wrapper around S3's SDK that aims to make it easier
 * to use for IEX purposes.  It could also serve as the foundation for an
 * abstraction layer across multiple storage engines, if needed.
 */
export class Storage {
  private logger = getLogger('storage');

  private s3Client: S3Client;

  constructor(readonly options: StorageOptions = {}) {
    this.s3Client = new S3Client({ ...defaultOptions, ...options });
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

  static normalizeUriOptions(options: StorageUriOptions): NormalizedStorageUriOptions {
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

    return { ...options, bucket, path, uri };
  }

  /**
   * Writes a string, Buffer, or ReadStream
   */
  async writeFile(options: StorageWriteOptions): Promise<string> {
    const { bucket, path, uri } = Storage.normalizeUriOptions(options);
    const { body, fileSize, stream } = options;

    if (body !== undefined) {
      const response = await this.s3Client.send(new PutObjectCommand({ Body: body, Bucket: bucket, Key: path }));

      this.logger.debug(`S3 file successfully uploaded with Etag: ${response.ETag} and URI: ${uri}`);
    } else if (stream === undefined) {
      throw new Error('Either body or stream options must be set.');
    } else {
      const uploadOptions: PutObjectCommandInput = { Body: stream, Bucket: bucket, Key: path };

      if (fileSize !== undefined) {
        uploadOptions.ContentLength = fileSize;
      }

      const response = await this.s3Client.send(new PutObjectCommand(uploadOptions));
      this.logger.debug(`S3 file successfully streamed with Etag: ${response.ETag} and URI: ${uri}`);
    }

    return uri;
  }

  /**
   * Returns a data stream of a file.
   */
  async streamFile(options: StorageReadOptions): Promise<Readable> {
    const { bucket, path, uri, range } = Storage.normalizeUriOptions(options);

    this.logger.debug(`Streaming from ${uri}`);

    const response = await this.s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: path, Range: range }));
    return response.Body as unknown as Readable;
  }

  /**
   * Checks if a file exists and returns true/false.
   */
  async exists(options: StorageReadOptions): Promise<boolean> {
    const { bucket, path, uri } = Storage.normalizeUriOptions(options);

    this.logger.debug(`Checking existance of ${uri}`);
    try {
      await this.s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: path }));
      return true;
    } catch (error: any) {
      if (error instanceof NotFound) return false;
      throw error;
    }
  }

  /**
   * Returns the raw response from the storage backend.
   *
   * @note The function executes a getObject() request
   * @param {string} key Key to get file from bucket
   * @range {string} range Optional range to retrieve
   * @returns {GetObjectCommandOutput} Returns requested S3 GetObject response
   */
  async rawGet(options: StorageReadOptions): Promise<GetObjectCommandOutput> {
    const { bucket, path, uri, range } = Storage.normalizeUriOptions(options);

    this.logger.debug(`Streaming from ${uri}`);

    return this.s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: path, Range: range }));
  }

  /**
   * Checks if a file exists and returns the raw HEAD response
   */
  async rawHead(options: StorageReadOptions): Promise<HeadObjectCommandOutput | undefined> {
    const { bucket, path, uri } = Storage.normalizeUriOptions(options);

    this.logger.debug(`Checking existance of ${uri}`);
    try {
      return await this.s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: path }));
    } catch (error: any) {
      if (error instanceof NotFound) return undefined;
      throw error;
    }
  }
}
