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

import { Flex, HStack, Skeleton, VStack } from '@chakra-ui/react';

export const InsightSkeleton = () => {
  return (
    <>
      {/* Desktop-only */}
      <Flex direction="column" justify="stretch" display={{ base: 'none', md: 'flex' }}>
        {/* Header */}
        <Flex direction="column" align="stretch" p="0.5rem">
          <HStack spacing={0} height="40px" align="stretch">
            {/* Item type icon */}
            <Skeleton boxSize="40px" mr="0.5rem" />

            {/* Item name */}
            <Skeleton size="lg" w="33%" />

            {/* Spacer */}
            <Flex flexGrow={1} />

            <HStack spacing="0.5rem" height="40px" align="stretch">
              <Skeleton width="40px" />
              <Skeleton width="40px" />
              <Skeleton width="65px" />
              <Skeleton width="65px" />
              <Skeleton width="65px" />
              <Skeleton width="40px" />
              <Skeleton width="60px" />
            </HStack>
          </HStack>
        </Flex>

        <Flex direction="row" mt="1rem">
          {/* Insight */}
          <VStack spacing="0.5rem" align="stretch" flexGrow={1} overflow="hidden" p="0.5rem" pt="2rem">
            <Skeleton mt="1rem" height="2rem" width="30%" />
            <Skeleton height="1.5rem" />
            <Skeleton height="1.5rem" />
            <Skeleton height="1.5rem" />
            <Skeleton height="1.5rem" width="74%" />
            <Flex h="2rem" />
            <Skeleton mt="1rem" height="2rem" width="30%" />
            <Skeleton height="1.5rem" />
            <Skeleton height="1.5rem" />
            <Skeleton height="1.5rem" />
            <Skeleton height="1.5rem" width="60%" />
          </VStack>

          {/* Sidebar */}
          <Flex
            flexDirection="column"
            flexBasis={{ base: '16rem', md: '20rem', xl: '22rem' }}
            flexShrink={0}
            maxWidth={{ base: '16rem', md: '20rem', xl: '26rem' }}
            ml="1rem"
            mt="0.5rem"
            align="stretch"
          >
            <Skeleton width="25%" height="1.5rem" />
            <Skeleton height="1.5rem" mt="0.5rem" />
            <Skeleton height="1.5rem" mt="0.5rem" />

            <Skeleton width="30%" height="1.5rem" mt="2rem" />
            <Skeleton height="1.5rem" mt="0.5rem" />

            <Skeleton width="30%" height="1.5rem" mt="2rem" />
            <Skeleton height="1.5rem" mt="0.5rem" />

            <HStack spacing="1rem" height="60px" mt="2rem">
              <Skeleton boxSize="60px" />
              <Skeleton boxSize="60px" />
            </HStack>

            <Skeleton width="30%" height="1.5rem" mt="2rem" />
            <Skeleton height="1.5rem" mt="0.5rem" />

            <Skeleton width="30%" height="1.5rem" mt="2rem" />
            <Skeleton height="1.5rem" mt="0.5rem" />
          </Flex>
        </Flex>
      </Flex>

      {/* Mobile-only */}
      <VStack align="stretch" justify="stretch" display={{ base: 'flex', md: 'none' }}>
        {/* Header */}
        <VStack spacing="0.5rem" align="stretch" flexGrow={1} overflow="hidden" p="0.5rem">
          <HStack spacing="1rem" height="40px" flexGrow={1}>
            <Skeleton height="32px" flexGrow={1} />
            <Skeleton height="32px" flexGrow={1} />
          </HStack>

          <HStack spacing={0} height="40px" align="stretch">
            {/* Item type icon */}
            <Skeleton boxSize="40px" mr="0.5rem" />

            {/* Item name */}
            <Skeleton size="lg" flexGrow={1} />
          </HStack>

          <HStack spacing="0.5rem" height="40px" flexGrow={1} justify="space-between">
            <Skeleton width="65px" height="40px" />
            <Skeleton width="65px" height="40px" />
            <Skeleton width="65px" height="40px" />
            <Skeleton width="40px" height="40px" />
          </HStack>
        </VStack>

        {/* Insight */}
        <VStack spacing="0.5rem" align="stretch" flexGrow={1} overflow="hidden" p="0.5rem" pt="2rem">
          <Skeleton mt="1rem" height="2rem" width="30%" />
          <Skeleton height="1.5rem" />
          <Skeleton height="1.5rem" />
          <Skeleton height="1.5rem" />
          <Skeleton height="1.5rem" width="74%" />
          <Flex h="2rem" />
          <Skeleton mt="1rem" height="2rem" width="30%" />
          <Skeleton height="1.5rem" />
          <Skeleton height="1.5rem" />
          <Skeleton height="1.5rem" />
          <Skeleton height="1.5rem" width="60%" />
        </VStack>
      </VStack>
    </>
  );
};
