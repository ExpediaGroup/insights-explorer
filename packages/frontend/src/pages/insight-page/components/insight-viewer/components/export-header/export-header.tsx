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

import { Badge, Box, BoxProps, HStack, Text, Tooltip, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { DateTime } from 'luxon';

import { Card } from '../../../../../../components/card/card';
import { InsightTag } from '../../../../../../components/insight-tag/insight-tag';
import { Linkify } from '../../../../../../components/linkify/linkify';
import { SidebarHeading } from '../../../../../../components/sidebar-heading/sidebar-heading';
import { UserTag } from '../../../../../../components/user-tag/user-tag';
import { Insight } from '../../../../../../models/generated/graphql';
import { formatDateIntl, formatRelativeIntl } from '../../../../../../shared/date-utils';

export const ExportHeader = ({ insight, ...props }: { insight: Insight } & BoxProps) => {
  if (insight == null) {
    return <Box></Box>;
  }

  return (
    <VStack as={Card} spacing="1rem" p="1rem" align="stretch" {...props} mb="1rem">
      <Wrap align="center">
        <WrapItem alignItems="baseline">
          <SidebarHeading mr="0.5rem">About</SidebarHeading>
          <Text>
            <Linkify>{insight.description}</Linkify>
            {insight.metadata?.publishedDate != null && (
              <Tooltip
                placement="bottom"
                label={`Published on ${formatDateIntl(insight.metadata.publishedDate, DateTime.DATETIME_MED)}`}
                aria-label="Published"
              >
                <Badge colorScheme="green" ml="0.5rem">
                  Published
                </Badge>
              </Tooltip>
            )}
          </Text>
        </WrapItem>

        {insight.metadata?.publishedDate != null && (
          <WrapItem alignItems="baseline">
            <SidebarHeading mr="0.5rem">Published Date</SidebarHeading>
            <Text>{formatDateIntl(insight.metadata.publishedDate, DateTime.DATE_MED)}</Text>
          </WrapItem>
        )}

        <WrapItem alignItems="baseline">
          <SidebarHeading mr="0.5rem">Last Updated</SidebarHeading>
          <Text>
            {formatDateIntl(insight.updatedAt, DateTime.DATETIME_MED)} ({formatRelativeIntl(insight.updatedAt)})
          </Text>
        </WrapItem>

        <WrapItem alignItems="baseline">
          <SidebarHeading mr="0.5rem">Created</SidebarHeading>
          <Text>
            {formatDateIntl(insight.createdAt, DateTime.DATETIME_MED)} ({formatRelativeIntl(insight.createdAt)})
          </Text>
        </WrapItem>
      </Wrap>

      <Wrap align="center">
        <WrapItem mr="2rem">
          <HStack spacing="0.25" align="center">
            <SidebarHeading mr="0.5rem">Authors</SidebarHeading>
            {insight.authors.edges.map(({ node: author }) => (
              <UserTag key={author.userName} user={author} size="lg" width="100%" />
            ))}
          </HStack>
        </WrapItem>
        <WrapItem>
          {insight.tags?.length > 0 && (
            <HStack spacing="0.25rem" align="center">
              <SidebarHeading mr="0.5rem">Tags</SidebarHeading>
              {insight.tags.map((tag) => (
                <InsightTag key={tag} tag={tag} size="lg" />
              ))}
            </HStack>
          )}
        </WrapItem>
      </Wrap>
    </VStack>
  );
};
