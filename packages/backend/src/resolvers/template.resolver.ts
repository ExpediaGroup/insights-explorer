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
import { ResolveTree } from 'graphql-parse-resolve-info';
import { Arg, Authorized, ID, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { Insight } from '../models/insight';
import { Permission } from '../models/permission';
import { InsightService } from '../services/insight.service';
import { TemplateService } from '../services/template.service';
import { Fields } from '../shared/field-parameter-decorator';
import { fromGlobalId } from '../shared/resolver-utils';

const logger = getLogger('template.resolver');
@Service()
@Resolver()
export class TemplateResolver {
  constructor(
    private readonly insightService: InsightService,
    private readonly templateService: TemplateService
  ) {}

  @Authorized<Permission>({ user: true })
  @Query(() => [Insight])
  async templates(@Fields() fields: { Insight: { [str: string]: ResolveTree } }): Promise<Insight[]> {
    try {
      return await this.templateService.getTemplates(this.getRequestedFields(fields));
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  /**
   * Queries for a single Insight Template by either ID or full name.
   *
   * When querying by ID, an error is thrown if the ID does not match.
   * When querying by full name, null is returned if the ID does not match.
   *
   * If neither argument is provided, an error is thrown.
   *
   * @param fields GraphQL query fields
   * @param templateId Template ID (optional)
   * @param fullName Template full name (optional)
   */
  @Authorized<Permission>({ user: true })
  @Query(() => Insight, { nullable: true })
  async template(
    @Fields() fields: { Insight: { [str: string]: ResolveTree } },
    @Arg('templateId', () => ID, { nullable: true }) templateId?: string,
    @Arg('fullName', { nullable: true }) fullName?: string
  ): Promise<Insight | null> {
    logger.debug(`Template by id (${templateId}) / name (${fullName})`);
    try {
      let template: Insight | null = null;

      if (templateId === undefined && fullName === undefined) {
        throw new Error('One of `templateId` or `fullName` arguments is required');
      }

      if (templateId != null) {
        const [, dbTemplateId] = fromGlobalId(templateId);
        template = (await this.templateService.getTemplate(dbTemplateId, this.getRequestedFields(fields))) as Insight;

        if (template === null) {
          throw new Error('Unable to retrieve Template with id: ' + templateId);
        }
      } else if (fullName != null) {
        template = (await this.insightService.getInsightByFullName(
          fullName,
          this.getRequestedFields(fields)
        )) as Insight;
      }

      return template;
    } catch (error: any) {
      logger.error(error);
      return error;
    }
  }

  private getRequestedFields(fields: { Insight: { [str: string]: ResolveTree } }): string[] {
    const requestedFields = Object.keys(fields.Insight);
    return [...new Set([...requestedFields, 'insightId'])];
  }
}
