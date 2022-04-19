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
import { SQS } from 'aws-sdk';
import { Consumer } from 'sqs-consumer';

const logger = getLogger('message-queue');

export interface SQSMessageQueueOptions {
  region: string;
  queueUrl: string;
}
export class MessageQueue {
  private sqsClient: SQS;

  constructor(readonly options: SQSMessageQueueOptions) {
    this.sqsClient = new SQS({
      region: options.region
    });
  }

  async sendMessage(body: Record<string, any>): Promise<string | undefined> {
    const response = await this.sqsClient
      .sendMessage({
        MessageBody: JSON.stringify(body),
        QueueUrl: this.options.queueUrl
      })
      .promise();
    return response.MessageId;
  }

  consumeMessages<T extends Record<string, any>>(handler: (body: T, message: SQS.Message) => Promise<void>): Consumer {
    const consumer = Consumer.create({
      queueUrl: this.options.queueUrl,
      region: this.options.region,
      handleMessage: async (message) => {
        logger.trace('Received message: ' + message.MessageId);

        let body: T;
        try {
          body = JSON.parse(message.Body!);
        } catch (error: any) {
          logger.error('Unable to parse body of message: ' + message.Body);
          logger.error('Error: ' + error);
        }

        try {
          await handler(body!, message);
        } catch (error: any) {
          logger.error('Error: ' + error);
          throw error;
        }
      }
    });

    consumer.on('error', (error) => {
      logger.error(error.message);
    });

    consumer.on('processing_error', (error) => {
      logger.error(error.message);
    });

    consumer.start();

    return consumer;
  }
}
