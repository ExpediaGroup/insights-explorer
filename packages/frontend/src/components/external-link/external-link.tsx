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

import type { LinkProps } from '@chakra-ui/react';
import { Icon, Link as ChakraLink } from '@chakra-ui/react';

import { iconFactory } from '../../shared/icon-factory';

interface Props {
  showIcon?: boolean;
}

/**
 * Custom external link component
 *
 * @param props RouterLinkProps
 */
export const ExternalLink = ({ showIcon = false, children, ...props }: Props & LinkProps) => {
  return (
    <ChakraLink {...props} isExternal={true} display="inline-block">
      {children}
      {showIcon && <Icon as={iconFactory('linkExternal')} ml="0.125rem" />}
    </ChakraLink>
  );
};
