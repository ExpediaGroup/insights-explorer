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
  Badge,
  BoxProps,
  Flex,
  Heading,
  HStack,
  LinkBox,
  Text,
  Tooltip,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import { DateTime } from 'luxon';

import { formatDateIntl } from '../../../../shared/date-utils';
import { getItemType } from '../../../../shared/item-type';
import { InsightAuthor } from '../../../insight-author/insight-author';
import { InsightTag } from '../../../insight-tag/insight-tag';
import { ItemTypeIcon } from '../../../item-type-icon/item-type-icon';
import { LinkOverlay } from '../../../link-overlay/link-overlay';
import { InsightConnectionCardProps } from '../../insight-connection-card';
import { InsightStats } from '../insight-stats/insight-stats';

export const DefaultInsightCard = ({ insightEdge, options, ...props }: InsightConnectionCardProps & BoxProps) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const insight = insightEdge.node;

  return (
    <LinkBox
      key={insight.id + '-' + insight.fullName}
      bg={bgColor}
      borderColor="gray.300"
      borderWidth="1px"
      borderRadius="0.5rem"
      borderLeftWidth="10px"
      borderLeftColor={getItemType(insight.itemType).color}
      _hover={{ boxShadow: 'md' }}
      {...props}
    >
      <VStack spacing="0.25rem" align="stretch" p="0.5rem">
        <HStack spacing="0.5rem" align="center">
          <ItemTypeIcon itemType={insight.itemType} />

          <LinkOverlay to={`/${insight.itemType}/${insight.fullName}`}>
            <Heading as="h2" size="lg">
              {insight.name}
            </Heading>
          </LinkOverlay>

          <InsightStats
            insightId={insight.id}
            commentCount={insight.commentCount}
            likeCount={insight.likeCount}
            viewerHasLiked={insight.viewerHasLiked}
            flexGrow={2}
            flexShrink={0}
            justifyContent="flex-end"
            alignSelf="start"
            position="relative"
            zIndex={1}
          />
        </HStack>

        <Text pl="0.5rem">{insight.description}</Text>

        <HStack>
          <Flex wrap="wrap">
            {insight.authors.edges.map(({ node: author }) => {
              return <InsightAuthor key={author.userName + '-' + author.displayName} author={author} m="0.25rem" />;
            })}
            {insight.tags.map((tag) => {
              return <InsightTag key={tag} tag={tag} dispatchSearch={options.dispatchSearch ?? true} m="0.25rem" />;
            })}
          </Flex>

          <VStack flexGrow={2} align="flex-end" alignSelf="flex-end" justify="flex-end" pr="0.5rem">
            {options.showScores && (
              <Tooltip
                label="This score indicates how relevant this Insight is to the search"
                aria-label="Relevance score"
              >
                <Badge position="relative" zIndex={1}>
                  {insightEdge.score?.toFixed(2)}
                </Badge>
              </Tooltip>
            )}

            {options.showUpdatedAt && (
              <Tooltip label="Date this Insight was last updated" aria-label="Updated At">
                <Text fontSize="xs" whiteSpace="nowrap" position="relative" zIndex={1}>
                  {formatDateIntl(insight.updatedAt, DateTime.DATE_MED)}
                </Text>
              </Tooltip>
            )}
          </VStack>
        </HStack>
      </VStack>
    </LinkBox>
  );
};
