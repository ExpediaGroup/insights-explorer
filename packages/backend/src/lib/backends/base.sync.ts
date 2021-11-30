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
import logger from '@iex/shared/logger';

import { defaultElasticsearchClient, ElasticIndex } from '../../lib/elasticsearch';
import { DbInsight } from '../../models/insight';
import { DbRepositoryType } from '../../models/repository-type';
import { InsightSyncTask } from '../../models/tasks';
import { ActivityService } from '../../services/activity.service';
import { InsightService } from '../../services/insight.service';

export abstract class BaseSync {
  private insightService = new InsightService(new ActivityService());

  async publishInsight(insight: IndexedInsight, refresh?: boolean): Promise<IndexedInsight> {
    const documentType = insight.itemType;
    const index = ElasticIndex.INSIGHTS;

    logger.info(`[BASE_SYNC] Publishing ${documentType} to Elasticsearch: ${insight.fullName}`);
    logger.debug(JSON.stringify(insight, null, 2));

    try {
      const result = await defaultElasticsearchClient.index({
        index,
        id: insight.insightId!.toString(),
        body: insight,
        // Refresh the relevant primary and replica shards immediately after the operation occurs,
        // so that the updated document appears in search results immediately
        // https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-refresh.html
        refresh
      });

      logger.debug(JSON.stringify(result));
      logger.info(`[BASE_SYNC] Successfully published ${documentType}: ${insight.fullName}`);
    } catch (error: any) {
      logger.error(`[BASE_SYNC] Error publishing ${documentType} to Elasticsearch`);
      logger.error(error);
      throw error;
    }

    return insight;
  }

  async updateDatabase(insightSyncTask: InsightSyncTask, insight: IndexedInsight): Promise<void> {
    const externalId = insight.repository.externalId;
    const { repositoryType, ...repositoryData } = insightSyncTask;

    // Using the External ID as the lookup key
    // This key should be unchanging to avoid creating duplicates
    let existingDbInsight = await DbInsight.query().where('externalId', externalId).first();

    if (existingDbInsight != undefined) {
      logger.silly('[BASE_SYNC] Insight does exist in database');
      await existingDbInsight.$query().patch({
        insightName: insight.fullName,
        itemType: insight.itemType,
        deletedAt: null
      });
    } else {
      logger.silly('[BASE_SYNC] Insight does not exist in database');

      // Check to see if the fullName already exists, but with a different externalID
      existingDbInsight = await DbInsight.query().where('insightName', insight.fullName).first();

      if (existingDbInsight != undefined) {
        // Assume the repo was deleted and recreated, and just update the external ID
        // (We've already checked to ensure the external ID is unique)
        logger.silly('[BASE_SYNC] Insight exists in database, but with a different externalId');
        await existingDbInsight.$query().patch({
          externalId,
          itemType: insight.itemType,
          deletedAt: null
        });
      } else {
        logger.silly('[BASE_SYNC] Insight does not exist in database');
        existingDbInsight = await DbInsight.query().insert({
          externalId,
          insightName: insight.fullName,
          repositoryTypeId: DbRepositoryType.query()
            .select('repositoryTypeId')
            .where('repositoryTypeName', repositoryType)
            .first(),
          repositoryData: repositoryData,
          itemType: insight.itemType
        });
      }
    }

    logger.silly(JSON.stringify(existingDbInsight, null, 2));

    // Use the Database ID as the document ID in Elasticsearch
    insight.insightId = existingDbInsight.insightId!;
  }

  async getPreviouslySyncedInsight(insightSyncTask: InsightSyncTask): Promise<IndexedInsight | null> {
    const { owner, repo } = insightSyncTask;
    const existingInsight = await this.insightService.getInsightByFullName(`${owner}/${repo}`);
    return existingInsight;
  }

  abstract sync(insightSyncTask: InsightSyncTask): Promise<IndexedInsight | null>;
}
