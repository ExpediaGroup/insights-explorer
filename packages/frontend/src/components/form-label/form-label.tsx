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

import type { FormLabelProps } from '@chakra-ui/react';
import { FormLabel as ChakraFormLabel } from '@chakra-ui/react';

interface Props {
  childre?: boolean;
}

/**
 * Custom Form Label
 */
export const FormLabel = ({ children, ...props }: Props & FormLabelProps) => {
  return (
    <ChakraFormLabel fontWeight="bold" fontSize="sm" {...props}>
      {children}
    </ChakraFormLabel>
  );
};
