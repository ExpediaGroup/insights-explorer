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
import { S3 } from 'aws-sdk';
import type { AWSError, Request } from 'aws-sdk';
import type { HeadObjectOutput } from 'aws-sdk/clients/s3';
import type { ReadStream } from 'fs-extra';

const defaultOptions: S3.Types.ClientConfiguration = {
  region: process.env.S3_REGION,
  maxRetries: 3
};

export function createS3Client(options: S3.Types.ClientConfiguration = defaultOptions): S3 {
  return new S3({ ...defaultOptions, ...options });
}

export const defaultS3Client = createS3Client();

/**
 * Writes data to the Insights Explorer bucket.
 *
 * @note The function executes a putobject() request
 * @param {Buffer | String} body file content to write to S3
 * @param {string} key S3 bucket key to write to
 * @returns {string} S3 bucket URI to the uploaded file
 * @throws {AWSError} If putobject request fails
 */
export async function writeToS3(body: Buffer | string, key: string): Promise<string> {
  const bucket = process.env.S3_BUCKET!;

  const response = await defaultS3Client.putObject({ Body: body, Bucket: bucket, Key: key }).promise();
  const uri = `s3://${bucket}/${key}`;

  logger.info(`[STORAGE] S3 file successfully uploaded with Etag: ${response.ETag} and URI: ${uri}`);
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
 * @throws {AWSError} If putobject request fails
 */
export async function streamToS3(stream: ReadStream, fileSize: number, key: string): Promise<string> {
  const bucket = process.env.S3_BUCKET!;

  const response = await defaultS3Client
    .putObject({ Body: stream, Bucket: bucket, ContentLength: fileSize, Key: key })
    .promise();
  const uri = `s3://${bucket}/${key}`;

  logger.info(`[STORAGE] S3 file successfully uploaded with Etag: ${response.ETag} and URI: ${uri}`);
  return uri;
}

/**
 * Reads data from the Insights Explorer S3 bucket.
 *
 * @note The function executes a getObject() request
 * @param {string} key Key to get file from bucket
 * @returns {Promise<Buffer>} Returns requested S3 buffer
 */
export async function readFromS3(key: string): Promise<Buffer> {
  const bucket = process.env.S3_BUCKET!;

  logger.info(`[STORAGE] Streaming from s3://${bucket}/${key}`);
  const file = await defaultS3Client.getObject({ Bucket: bucket, Key: key }).promise();

  return Buffer.from(file.Body as Buffer);
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

  logger.info(`[STORAGE] Streaming from s3://${bucket}/${key}`);

  const response = defaultS3Client.getObject({ Bucket: bucket, Key: key, Range: range });

  return response.createReadStream() as ReadStream;
}

/**
 * Gets an Object from the Insights Explorer S3 bucket.
 *
 * @note The function executes a getObject() request
 * @param {string} key Key to get file from bucket
 * @range {string} range Optional range to retrieve
 * @returns {Request<S3.Types.GetObjectOutput, AWSError>} Returns requested S3 GetObject response
 */
export function getFromS3(key: string, range?: string): Request<S3.Types.GetObjectOutput, AWSError> {
  const bucket = process.env.S3_BUCKET!;

  logger.info(`[STORAGE] Streaming from s3://${bucket}/${key}`);

  return defaultS3Client.getObject({ Bucket: bucket, Key: key, Range: range });
}

/**
 * Returns a file head request.
 *
 * @note The function executes a headObject() request
 * @param {string} key Key of file to check in bucket
 * @returns {Request<S3.Types.HeadObjectOutput, AWSError>} Returns requested S3 HeadObject response
 */
export async function headFromS3(key: string): Promise<HeadObjectOutput | undefined> {
  const bucket = process.env.S3_BUCKET!;

  logger.info(`[STORAGE] Checking existance of s3://${bucket}/${key}`);
  try {
    return await defaultS3Client.headObject({ Bucket: bucket, Key: key }).promise();
  } catch (error: any) {
    if (error.code == 'NotFound') return undefined;
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

  logger.info(`[STORAGE] Checking existance of s3://${bucket}/${key}`);
  try {
    await defaultS3Client.headObject({ Bucket: bucket, Key: key }).promise();
    return true;
  } catch (error: any) {
    if (error.code == 'NotFound') return false;
    throw error;
  }
}
