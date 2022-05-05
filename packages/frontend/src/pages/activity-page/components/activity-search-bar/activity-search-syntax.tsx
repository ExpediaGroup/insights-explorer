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

import {
  Box,
  Code,
  Heading,
  HStack,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
  VStack
} from '@chakra-ui/react';

import { iconFactoryAs } from '../../../../shared/icon-factory';

export const ActivitySearchSyntax = () => {
  const tooltip = 'Show search syntax guide';
  return (
    <Popover placement={useBreakpointValue({ base: 'auto', md: 'start-start' })} isLazy>
      <PopoverTrigger>
        <Box>
          <Tooltip label={tooltip} aria-label={tooltip}>
            <IconButton variant="ghost" icon={iconFactoryAs('help')} aria-label={tooltip} />
          </Tooltip>
        </Box>
      </PopoverTrigger>
      <PopoverContent zIndex={9000} {...useBreakpointValue({ base: {}, lg: { width: 'auto', maxWidth: '3xl' } })}>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader>
          <Heading as="h4" size="md">
            Search Syntax Guide
          </Heading>
        </PopoverHeader>
        <PopoverBody>
          <Stack direction={{ base: 'column', lg: 'row' }} fontSize="sm">
            <VStack align="flex-start" flexBasis="50%">
              <Heading as="h5" size="sm">
                Syntax
              </Heading>
              <Box>
                <Code>term</Code>
                <Text>Search for results containing the given term</Text>
              </Box>
              <Box>
                <Code>"search phrase"</Code>
                <Text>Search for results containing quoted phrase exactly</Text>
              </Box>
              <Box>
                <HStack>
                  <Code>filter:string</Code>
                  <Text>/</Text>
                  <Code>filter:"string"</Code>
                </HStack>
                <Text>Match a filter value</Text>
              </Box>
              <Box>
                <HStack>
                  <Code>filter:{`{string, string, ...}`}</Code>
                </HStack>
                <Text>Match one or more filter values</Text>
              </Box>
              <Box>
                <VStack align="flex-start">
                  <HStack wrap="wrap">
                    <Code>filter:&lt;value</Code>
                    <Text>/</Text>
                    <Code>filter:&lt;=value</Code>
                  </HStack>
                  <HStack wrap="wrap">
                    <Code>filter:&gt;value</Code>
                    <Text>/</Text>
                    <Code>filter:&gt;=value</Code>
                  </HStack>
                  <HStack wrap="wrap">
                    <Code>filter:[value to value]</Code>
                  </HStack>
                </VStack>
                <Text>Match a filter to a range value</Text>
              </Box>
            </VStack>
            <VStack align="flex-start" flexBasis="50%">
              <Heading as="h5" size="sm">
                Filters
              </Heading>
              <Box>
                <HStack>
                  <Code>user:username</Code>
                </HStack>
                <Text>Activity user</Text>
              </Box>
              <Box>
                <VStack align="flex-start">
                  <Code>activityType:filter</Code>

                  <Code>activityType:{`{filter, ...}`}</Code>
                </VStack>
                <Text>Activity type(s)</Text>
              </Box>
              <Box>
                <Code>insight:insightFullName</Code>
                <Text>Related Insight</Text>
              </Box>
              <Box>
                <VStack align="flex-start">
                  <Code>occurredAt:dateFilter</Code>
                </VStack>
                <Text>Filter by a single date or range of dates</Text>
              </Box>
            </VStack>
          </Stack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
