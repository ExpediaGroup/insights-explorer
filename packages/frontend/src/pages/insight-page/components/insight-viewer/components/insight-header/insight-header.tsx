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

import { Box, Flex, Heading, HStack, Stack } from '@chakra-ui/react';

import { ItemTypeIcon } from '../../../../../../components/item-type-icon/item-type-icon';
import { Insight, User } from '../../../../../../models/generated/graphql';
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

export const InsightHeader = ({
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
      <Flex direction="column" align="stretch" p="0.5rem">
        <Stack spacing="0.5rem" align={{ base: 'stretch', md: 'flex-start' }} direction={{ base: 'column', md: 'row' }}>
          <Box flexGrow={1}>
            {/* Mobile-only */}
            {!isExport && (
              <NavigationButtons
                insight={insight}
                nextInsight={nextInsight}
                previousInsight={previousInsight}
                display={{ base: 'flex', md: 'none' }}
                mb="0.5rem"
              />
            )}

            <HStack spacing="1rem" flexGrow={1} align="stretch">
              <ItemTypeIcon itemType={insight.itemType} fontSize={{ base: '2rem' }} />
              <Heading as="h1" size="lg">
                {insight.name}
              </Heading>
            </HStack>
          </Box>

          {!isExport && (
            <>
              {/* Desktop-only */}
              <NavigationButtons
                insight={insight}
                nextInsight={nextInsight}
                previousInsight={previousInsight}
                display={{ base: 'none', md: 'flex' }}
              />

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
            </>
          )}
        </Stack>
      </Flex>
    </>
  );
};
