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

import { Box, HStack, Skeleton, StackDivider, VStack } from '@chakra-ui/react';

const widthArray = ['50%', '25%', '80%', '40%', '66%'];
export const ActivityListSkeleton = ({ count = 3 }) => {
  return (
    <VStack align="stretch" divider={<StackDivider borderColor="snowstorm.300" />}>
      {new Array(count).fill(1).map((value, index) => (
        <VStack key={`activity-icon-skeleton-${index}`} align="stretch">
          <HStack>
            <Skeleton boxSize="1.5rem" />
            <Box flexGrow={2}>
              <Skeleton height="1.5rem" width={widthArray[index % 5]} />
            </Box>
            <Skeleton height="1.5rem" width="4.5rem" />
          </HStack>
          <Box>
            <Skeleton ml="2rem" height="2.5rem" width="auto" />
          </Box>
        </VStack>
      ))}
    </VStack>
  );
};
