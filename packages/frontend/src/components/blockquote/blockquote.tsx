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

import type { TextProps } from '@chakra-ui/react';
import { Text } from '@chakra-ui/react';

export const BlockQuote = ({ children, ...props }: { children: any } & TextProps) => {
  return (
    <Text
      as="blockquote"
      fontStyle="italic"
      p={2}
      mb="1rem"
      borderLeft="6px solid"
      borderColor="frost.300"
      bg="snowstorm.200"
      {...props}
    >
      {children}
    </Text>
  );
};
