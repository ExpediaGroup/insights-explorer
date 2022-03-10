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
  Box,
  BoxProps,
  Heading,
  HStack,
  LinkBox,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
  Wrap,
  WrapItem
} from '@chakra-ui/react';

import { getInsightGradient } from '../../../../shared/gradient';
import { Card } from '../../../card/card';
import { InsightTag } from '../../../insight-tag/insight-tag';
import { ItemTypeIcon } from '../../../item-type-icon/item-type-icon';
import { LinkOverlay } from '../../../link-overlay/link-overlay';
import { UserTag } from '../../../user-tag/user-tag';
import { InsightConnectionCardProps } from '../../insight-connection-card';
import { InsightStats } from '../insight-stats/insight-stats';

export const SquareInsightCard = ({ insightEdge, options, ...props }: InsightConnectionCardProps & BoxProps) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const insight = insightEdge.node;

  return (
    <LinkBox key={insight.id + '-' + insight.fullName} alignSelf="stretch">
      <VStack
        as={Card}
        bg={bgColor}
        p="1rem"
        width={{ base: 'unset', sm: '16rem', md: '17rem', lg: '18rem', '2xl': '20rem' }}
        align="stretch"
        overflow="hidden"
        sx={{ aspectRatio: '1' }}
        _hover={{ boxShadow: 'lg' }}
        {...props}
      >
        <HStack
          spacing="0.5rem"
          align="center"
          mx="-1rem"
          mt="-1rem"
          px="1rem"
          height="23%"
          bgGradient={getInsightGradient(insight)}
          color="black"
          flexShrink={0}
        >
          <ItemTypeIcon itemType={insight.itemType} />

          <LinkOverlay to={`/${insight.itemType}/${insight.fullName}`} underline={false}>
            <Heading fontSize={{ base: 'md', '2xl': 'lg' }} fontWeight="bold" noOfLines={2}>
              {insight.name}
            </Heading>
          </LinkOverlay>
        </HStack>

        <Text flexShrink={0} fontSize={{ base: 'sm', lg: 'md' }} noOfLines={{ base: 2, lg: 3, '2xl': 4 }}>
          {insight.description}
        </Text>

        <VStack flexGrow={2} align="stretch" justify="flex-end">
          <Wrap spacing="0.25rem" align="flex-start">
            {insight.authors.edges.slice(0, 5).map(({ node: author }) => {
              return (
                <WrapItem key={author.userName}>
                  <UserTag user={author} />
                </WrapItem>
              );
            })}
            {/* If there are tags, force the tags onto the next row */}
            {insight.tags.length > 0 && <Box flexBasis="100%" height={0} />}

            {insight.tags.slice(0, 5).map((tag) => {
              return (
                <WrapItem key={tag}>
                  <InsightTag tag={tag} dispatchSearch={options.dispatchSearch ?? true} />
                </WrapItem>
              );
            })}

            {/* <Box flexGrow={2} /> */}

            <WrapItem flexGrow={4} justifyContent="flex-end">
              <HStack flexShrink={0}>
                {options.showScores && (
                  <Box flexGrow={2}>
                    <Tooltip
                      label="This score indicates how relevant this Insight is to the search"
                      aria-label="Relevance score"
                    >
                      <Badge position="relative" zIndex={1}>
                        {insightEdge.score?.toFixed(2) || '0.0'}
                      </Badge>
                    </Tooltip>
                  </Box>
                )}

                <InsightStats
                  insightId={insight.id}
                  commentCount={insight.commentCount}
                  likeCount={insight.likeCount}
                  viewerHasLiked={insight.viewerHasLiked}
                  justifyContent="flex-end"
                  alignSelf="start"
                  position="relative"
                  zIndex={1}
                />
              </HStack>
            </WrapItem>
          </Wrap>
        </VStack>
      </VStack>
    </LinkBox>
  );
};
