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

import { Heading, HeadingProps } from '@chakra-ui/react';

interface Props {
  level: number;
}
/**
 * Customized heading with built-in stylings
 *
 */
export const IexHeading = ({ children, level, ...props }: Props & HeadingProps) => {
  const sizes = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const mt = ['2rem', '1.75rem', '1.5rem', '1rem', '1rem', '1rem'];
  return (
    <Heading as={`h${level}` as any} mb="0.5rem" mt={mt[level - 1]} size={sizes[level - 1]} {...props}>
      {children}
    </Heading>
  );
};
