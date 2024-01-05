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

import { IndexedInsight } from '@iex/models/indexed/indexed-insight';
import { getLogger } from '@iex/shared/logger';
import Container from 'typedi';

import { defaultElasticsearchClient, ElasticIndex } from '../../lib/elasticsearch';
import { DbInsight } from '../../models/insight';
import { DbRepositoryType } from '../../models/repository-type';
import { InsightSyncTask } from '../../models/tasks';
import { InsightService } from '../../services/insight.service';

const logger = getLogger('base.sync');

export const THUMBNAIL_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
export const THUMBNAIL_LOCATIONS = ['thumbnail', '.iex/thumbnail'].flatMap((prefix) =>
  THUMBNAIL_EXTENSIONS.map((extension) => prefix + extension)
);

export const READONLY_FILES = new Set(['insight.yml']);

export const INDEXABLE_MIME_TYPES = new Set([
  'application/x-ipynb+json',
  'application/javascript',
  'application/json',
  'application/x-sh',
  'application/x-sql',
  'application/x-typescript',
  'application/xml',
  'text/html',
  'text/markdown',
  'text/plain',
  'text/x-clojure',
  'text/x-groovy',
  'text/x-java-source',
  'text/x-python',
  'text/x-r',
  'text/x-ruby',
  'text/x-scala',
  'text/yaml'
]);

export abstract class BaseSync {
  protected insightService = Container.get(InsightService);

  async publishInsight(insight: IndexedInsight, refresh?: boolean): Promise<IndexedInsight> {
    const documentType = insight.itemType;
    const index = ElasticIndex.INSIGHTS;

    // Calculate dynamic values and store with the Insight
    const [commentCount, likeCount, viewCount] = await Promise.all([
      this.insightService.commentCount(insight.insightId!),
      this.insightService.likeCount(insight.insightId!),
      this.insightService.getViewCount(insight.insightId!)
    ]);

    insight.commentCount = commentCount;
    insight.likeCount = likeCount;
    insight.viewCount = viewCount;

    logger.info(`Publishing ${documentType} to Elasticsearch: ${insight.fullName}`);
    //logger.trace(JSON.stringify(insight, null, 2));

    try {
      await defaultElasticsearchClient.index({
        index,
        id: insight.insightId!.toString(),
        body: insight,
        // Refresh the relevant primary and replica shards immediately after the operation occurs,
        // so that the updated document appears in search results immediately
        // https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-refresh.html
        refresh
      });

      //logger.trace(JSON.stringify(result));
      logger.info(`Successfully published ${documentType}: ${insight.fullName}`);
    } catch (error: any) {
      logger.error(`Error publishing ${documentType} to Elasticsearch`);
      logger.error(error);
      throw error;
    }

    return insight;
  }

  async updateDatabase(insightSyncTask: InsightSyncTask, insight: IndexedInsight): Promise<IndexedInsight> {
    const externalId = insight.repository.externalId;
    const { repositoryType, ...repositoryData } = insightSyncTask;

    // Using the External ID as the lookup key
    // This key should be unchanging to avoid creating duplicates
    let existingDbInsight = await DbInsight.query().where('externalId', externalId).first();

    if (existingDbInsight != undefined) {
      logger.trace('Insight does exist in database');
      await existingDbInsight.$query().patch({
        insightName: insight.fullName,
        itemType: insight.itemType,
        deletedAt: null,
        repositoryData
      });
    } else {
      logger.trace('Insight does not exist in database');

      // Check to see if the fullName already exists, but with a different externalID
      existingDbInsight = await DbInsight.query().where('insightName', insight.fullName).first();

      if (existingDbInsight != undefined) {
        // Assume the repo was deleted and recreated, and just update the external ID
        // (We've already checked to ensure the external ID is unique)
        logger.trace('Insight exists in database, but with a different externalId');
        await existingDbInsight.$query().patch({
          externalId,
          itemType: insight.itemType,
          deletedAt: null,
          repositoryData
        });
      } else {
        logger.trace('Insight does not exist in database');
        existingDbInsight = await DbInsight.query().insert({
          externalId,
          insightName: insight.fullName,
          repositoryTypeId: DbRepositoryType.query()
            .select('repositoryTypeId')
            .where('repositoryTypeName', repositoryType)
            .first(),
          repositoryData,
          itemType: insight.itemType
        });
      }
    }

    logger.trace(JSON.stringify(existingDbInsight, null, 2));

    // Use the Database ID as the document ID in Elasticsearch
    insight.insightId = existingDbInsight.insightId!;

    return insight;
  }

  async getPreviouslySyncedInsight(fullName: string): Promise<IndexedInsight | null> {
    return await this.insightService.getInsightByFullName(fullName);
  }

  abstract sync(insightSyncTask: InsightSyncTask): Promise<IndexedInsight | null>;
}
