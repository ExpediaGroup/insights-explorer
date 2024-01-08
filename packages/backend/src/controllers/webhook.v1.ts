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

import { IncomingHttpHeaders } from 'http';

import { RepositoryType } from '@iex/models/repository-type';
import { getLogger } from '@iex/shared/logger';
import { Request, Response } from 'express';

import { defaultElasticsearchClient, ElasticIndex } from '../lib/elasticsearch';
import insightQueue from '../lib/insight-queue';
import { InsightSyncTask } from '../models/tasks';

const logger = getLogger('webhook.v1');

type Webhook = any & { headers: IncomingHttpHeaders };

/**
 * ALL /
 */
export const hook = (req: Request, res: Response): void => {
  logger.info('Webhook received!');

  const webhook: Webhook = {
    ...req.body,
    headers: {
      ...req.headers
    }
  };

  // Remove some un-needed fields
  delete webhook.enterprise;
  delete webhook.master_branch;
  delete webhook.sender;
  delete webhook.team;
  delete webhook.zen;

  // Track webhooks in Elasticsearch
  defaultElasticsearchClient.index({
    index: ElasticIndex.WEBHOOKS,
    body: webhook
  });

  // Convert Webhook to Sync task
  let insightSyncTask: InsightSyncTask | null = null;
  if (req.headers['x-github-event'] !== undefined) {
    insightSyncTask = handleGitHub(webhook);
  } else if (webhook.path === undefined) {
    res.status(400).send('Not Recognized');
    return;
  } else {
    insightSyncTask = {
      repositoryType: RepositoryType.FILE,
      owner: 'local',
      repo: webhook.path
    };
  }

  if (insightSyncTask == null) {
    res.status(200).send('ACK (SKIPPED)');
    return;
  }

  // Queue up task to sync repository
  insightQueue.push(insightSyncTask);

  res.status(202).send('ACK');
};

function handleGitHub(webhook: Webhook): InsightSyncTask | null {
  // Filter out events that aren't needed
  if (webhook.headers['x-github-event'] === 'ping') {
    return null;
  }

  return {
    repositoryType: RepositoryType.GITHUB,
    owner: webhook.repository.owner.login,
    repo: webhook.repository.name
  };
}
