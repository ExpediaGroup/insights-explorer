/**
 * Copyright 2022 Expedia, Inc.
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

import { Box, Heading, HStack, Stack, Text, VStack } from '@chakra-ui/react';

import { ItemTypeIcon } from '../../../../../../components/item-type-icon/item-type-icon';
import { Linkify } from '../../../../../../components/linkify/linkify';
import { Insight, User } from '../../../../../../models/generated/graphql';
import { getInsightGradient } from '../../../../../../shared/gradient';
import { ActionBar } from '../action-bar/action-bar';
import { NavigationButtons } from '../navigation-buttons/navigation-buttons';

interface Props {
  insight: Insight;
  isExport: boolean;
  nextInsight?: Pick<Insight, 'id' | 'name' | 'fullName' | 'itemType'>;
  previousInsight?: Pick<Insight, 'id' | 'name' | 'fullName' | 'itemType'>;
  onClone: () => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onFetchLikedBy: (insightId?: string) => Promise<User[]>;
  onLike: (liked: boolean) => Promise<boolean>;
}

export const PageHeader = ({
  insight,
  nextInsight,
  previousInsight,
  isExport,
  onClone,
  onDelete,
  onFetchLikedBy,
  onLike
}: Props) => {
  if (insight == null) {
    return <Box></Box>;
  }

  return (
    <>
      <VStack align="stretch" p="0.5rem" bgGradient={getInsightGradient(insight)}>
        {!isExport && (
          <Box>
            {/* Mobile-only */}
            <NavigationButtons
              insight={insight}
              nextInsight={nextInsight}
              previousInsight={previousInsight}
              display={{ base: 'flex', md: 'none' }}
              mb="0.5rem"
            />

            <HStack spacing="0.5rem" align="top" justify="space-between">
              <ItemTypeIcon itemType={insight.itemType} fontSize={{ base: '2rem' }} />

              {/* Desktop-only */}
              <Stack
                spacing="1rem"
                align={{ base: 'stretch', md: 'center' }}
                direction={{ base: 'column', md: 'row' }}
                display={{ base: 'none', md: 'flex' }}
              >
                <NavigationButtons insight={insight} nextInsight={nextInsight} previousInsight={previousInsight} />
                <ActionBar
                  insight={insight}
                  nextInsight={nextInsight}
                  previousInsight={previousInsight}
                  onClone={onClone}
                  onDelete={onDelete}
                  onFetchLikedBy={onFetchLikedBy}
                  onLike={onLike}
                  isExport={isExport}
                />
              </Stack>
            </HStack>
          </Box>
        )}

        <VStack align="center" paddingTop="2rem" paddingBottom="4rem" textAlign="center">
          <Heading as="h1" size="lg" flexGrow={1}>
            {insight.name}
          </Heading>

          <Text>
            <Linkify>{insight.description}</Linkify>
          </Text>
        </VStack>

        {!isExport && (
          // Mobile-only
          <Stack
            align={{ base: 'stretch', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            display={{ base: 'flex', md: 'none' }}
          >
            <ActionBar
              insight={insight}
              nextInsight={nextInsight}
              previousInsight={previousInsight}
              onClone={onClone}
              onDelete={onDelete}
              onFetchLikedBy={onFetchLikedBy}
              onLike={onLike}
              isExport={isExport}
            />
          </Stack>
        )}
      </VStack>
    </>
  );
};
