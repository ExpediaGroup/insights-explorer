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
import type { MessageAttachment } from '@slack/bolt';

import { getInsight } from './iex';

interface Link {
  domain: string;
  url: string;
}

interface InsightKey {
  namespace: string;
  name: string;
}

export const matchInsightLink = (url: string): InsightKey | undefined => {
  // .../insight/namespace/name
  const matches = url.match(/.*?\/(?:insight|page)\/(.+?)\/([^/]+)/);

  if (matches && matches.length > 2) {
    return {
      namespace: matches[1],
      name: matches[2]
    };
  }
};

const EXCERPT_LENGTH = 512;

export const getExcerpt = (contents: string): string => {
  return contents.slice(0, Math.max(0, EXCERPT_LENGTH)) + (contents.length > EXCERPT_LENGTH + 1 ? '...' : '');
};

export const unfurlInsight = async (namespace: string, name: string): Promise<MessageAttachment | undefined> => {
  const insight = await getInsight(namespace, name);

  if (insight === undefined) {
    logger.warn(`[UNFURLS] Insight not found: ${namespace}/${name}`);
    return undefined;
  }

  const unfurl = {
    color: '#8fbcbb',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: insight.name
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: insight.description
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: `Author(s): ${insight.contributors.map((user) => user.displayName).join(', ')}`
          }
        ]
      }
      // {
      //   type: 'divider'
      // },
      // {
      //   type: 'section',
      //   text: {
      //     type: 'mrkdwn',
      //     text: getExcerpt(insight.readme.contents)
      //   }
      // }
    ]
  };

  return unfurl;
};

export const getUnfurl = async (link: Link): Promise<MessageAttachment | undefined> => {
  // Match for Insight links
  const insightKey = matchInsightLink(link.url);

  if (insightKey !== undefined) {
    return unfurlInsight(insightKey.namespace, insightKey.name);
  }
};
