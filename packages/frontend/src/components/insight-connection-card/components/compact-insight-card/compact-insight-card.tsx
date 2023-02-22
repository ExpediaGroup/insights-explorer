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

import type { BoxProps } from '@chakra-ui/react';
import { Flex } from '@chakra-ui/react';
import { Badge, Heading, HStack, LinkBox, Tooltip, useColorModeValue, Wrap, WrapItem } from '@chakra-ui/react';

import { InsightTag } from '../../../insight-tag/insight-tag';
import { ItemTypeIcon } from '../../../item-type-icon/item-type-icon';
import { LinkOverlay } from '../../../link-overlay/link-overlay';
import type { InsightConnectionCardProps } from '../../insight-connection-card';
import { InsightStats } from '../insight-stats/insight-stats';

export const CompactInsightCard = ({ insightEdge, options, ...props }: InsightConnectionCardProps & BoxProps) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const insight = insightEdge.node;

  return (
    <LinkBox
      key={insight.id + '-' + insight.fullName}
      bg={bgColor}
      borderColor="gray.300"
      borderWidth="1px"
      borderRadius="0.5rem"
      _hover={{ boxShadow: 'md' }}
      {...props}
    >
      <HStack spacing="0.5rem" p="0.5rem">
        <ItemTypeIcon itemType={insight.itemType} />

        <LinkOverlay to={`/${insight.itemType}/${insight.fullName}`} noOfLines={2}>
          <Heading as="h2" fontSize={{ base: 'md', lg: 'lg', '2xl': 'xl' }}>
            {insight.name}
          </Heading>
        </LinkOverlay>

        <Flex flexGrow={2}>
          {insight.isUnlisted === true && (
            <Tooltip placement="bottom" label={`Unlisted from search results`} aria-label="Unlisted">
              <Badge variant="frost">Unlisted</Badge>
            </Tooltip>
          )}
        </Flex>

        <Wrap spacing={0} justifyContent="flex-end" position="relative" display={{ base: 'none', md: 'flex' }}>
          {insight.tags.slice(0, 5).map((tag) => {
            return (
              <WrapItem key={tag}>
                <InsightTag tag={tag} dispatchSearch={options.dispatchSearch ?? true} m="0.125rem" />
              </WrapItem>
            );
          })}
        </Wrap>

        <InsightStats
          insightId={insight.id}
          commentCount={insight.commentCount}
          likeCount={insight.likeCount}
          viewerHasLiked={insight.viewerHasLiked}
          flexShrink={0}
          position="relative"
          zIndex={1}
        />

        {options.showScores && (
          <Tooltip label="This score indicates how relevant this Insight is to the search" aria-label="Relevance score">
            <Badge position="relative" zIndex={1}>
              {insightEdge.score?.toFixed(2)}
            </Badge>
          </Tooltip>
        )}
      </HStack>
    </LinkBox>
  );
};
