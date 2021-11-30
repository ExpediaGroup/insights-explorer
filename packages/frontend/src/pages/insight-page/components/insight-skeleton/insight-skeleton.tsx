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
      <Flex direction="column" justify="stretch" flexGrow={2}>
        {/* Header */}
        <Flex direction="column" align="stretch" p="0.5rem">
          <HStack spacing={0} height="40px" align="stretch">
            <Skeleton boxSize="40px" mr="0.5rem" />

            <Skeleton size="lg" w="33%" />

            <Flex flexGrow={1} />
            <Skeleton width="60px" mr="0.5rem" />
            <Skeleton width="60px" mr="0.5rem" />
            <Skeleton width="40px" mr="0.5rem" />
            <Skeleton width="40px" mr="0.5rem" />
            <Skeleton width="60px" mr="0.5rem" />
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

            <HStack spacing="1rem" height="40px" mt="2rem">
              <Skeleton boxSize="40px" />
              <Skeleton boxSize="40px" />
            </HStack>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
};
