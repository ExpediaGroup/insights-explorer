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

import { Box, BoxProps, useColorModeValue } from '@chakra-ui/react';

export const Card = (boxProps: BoxProps) => {
  return (
    <Box
      bg={useColorModeValue('white', 'gray.700')}
      borderColor="gray.300"
      borderWidth="1px"
      borderRadius="0.5rem"
      p="0.5rem"
      {...boxProps}
    >
      {boxProps.children}
    </Box>
  );
};
