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

import {
  GetObjectCommand,
  GetObjectCommandOutput,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  NotFound,
  PutObjectCommand,
  S3Client,
  S3ClientConfig
} from '@aws-sdk/client-s3';
import { getLogger } from '@iex/shared/logger';
import type { ReadStream } from 'fs-extra';

const logger = getLogger('storage');

const defaultOptions: S3ClientConfig = {
  region: process.env.S3_REGION,
  maxAttempts: 4,

  endpoint: process.env.S3_ENDPOINT !== '' ? process.env.S3_ENDPOINT : undefined,

  // S3 Path-style requests are deprecated
  // But some S3-compatible APIs may use them (e.g. Minio)
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' ? true : undefined
};

export function createS3Client(options: S3ClientConfig = defaultOptions): S3Client {
  return new S3Client({ ...defaultOptions, ...options });
}

export const defaultS3Client = createS3Client();

/**
 * Writes data to the Insights Explorer bucket.
 *
 * @note The function executes a putobject() request
 * @param {Buffer | String} body file content to write to S3
 * @param {string} key S3 bucket key to write to
 * @returns {string} S3 bucket URI to the uploaded file
 * @throws {Error} If putobject request fails
 */
export async function writeToS3(body: Buffer | string, key: string): Promise<string> {
  const bucket = process.env.S3_BUCKET!;

  const response = await defaultS3Client.send(new PutObjectCommand({ Body: body, Bucket: bucket, Key: key }));
  const uri = `s3://${bucket}/${key}`;

  logger.info(`S3 file successfully uploaded with Etag: ${response.ETag} and URI: ${uri}`);
  return uri;
}

/**
 * Writes a stream to the Insights Explorer bucket.
 *
 * @note The function executes a putobject() request
 * @param {ReadStream} stream stream content to write to S3
 * @param {number} fileSize Size of the file
 * @param {string} key S3 bucket key to write to
 * @returns {string} S3 bucket URI to the uploaded file
 * @throws {Error} If putobject request fails
 */
export async function streamToS3(stream: ReadStream, fileSize: number, key: string): Promise<string> {
  const bucket = process.env.S3_BUCKET!;

  const response = await defaultS3Client.send(
    new PutObjectCommand({ Body: stream, Bucket: bucket, ContentLength: fileSize, Key: key })
  );
  const uri = `s3://${bucket}/${key}`;

  logger.info(`S3 file successfully uploaded with Etag: ${response.ETag} and URI: ${uri}`);
  return uri;
}

/**
 * Streams data from the Insights Explorer S3 bucket.
 *
 * @note The function executes a getObject() request
 * @param {string} key Key to get file from bucket
 * @range {string} range Optional range to retrieve
 * @returns {Promise<ReadStream>} Returns requested S3 file stream
 */
export async function streamFromS3(key: string, range?: string): Promise<ReadStream> {
  const bucket = process.env.S3_BUCKET!;

  logger.info(`Streaming from s3://${bucket}/${key}`);

  const response = await defaultS3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: range }));

  return response.Body as unknown as ReadStream;
}

/**
 * Gets an Object from the Insights Explorer S3 bucket.
 *
 * @note The function executes a getObject() request
 * @param {string} key Key to get file from bucket
 * @range {string} range Optional range to retrieve
 * @returns {GetObjectCommandOutput} Returns requested S3 GetObject response
 */
export function getFromS3(key: string, range?: string): Promise<GetObjectCommandOutput> {
  const bucket = process.env.S3_BUCKET!;

  logger.info(`Streaming from s3://${bucket}/${key}`);

  return defaultS3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: range }));
}

/**
 * Returns a file head request.
 *
 * @note The function executes a headObject() request
 * @param {string} key Key of file to check in bucket
 * @returns {Request<S3.Types.HeadObjectOutput, AWSError>} Returns requested S3 HeadObject response
 */
export async function headFromS3(key: string): Promise<HeadObjectCommandOutput | undefined> {
  const bucket = process.env.S3_BUCKET!;

  logger.info(`Checking existance of s3://${bucket}/${key}`);
  try {
    return await defaultS3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error: any) {
    if (error instanceof NotFound) return undefined;

    logger.error(JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Checks if a file exists in S3 and returns true/false
 *
 * @note The function executes a headObject() request
 * @param {string} key Key of file to check in bucket
 * @returns {Promise<boolean>} Returns true if the file exists, else false
 */
export async function existsInS3(key: string): Promise<boolean> {
  const bucket = process.env.S3_BUCKET!;

  logger.info(`Checking existance of s3://${bucket}/${key}`);
  try {
    await defaultS3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error: any) {
    if (error instanceof NotFound) return false;
    throw error;
  }
}
