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

import { Box, Icon, Link, MenuItem, Square } from '@chakra-ui/react';
import { MouseEventHandler, ReactChildren, ReactElement } from 'react';
import { IconType } from 'react-icons';
import { LinkProps } from 'react-router-dom';

import { Link as RouterLink } from '../link/link';

interface Props {
  href?: string;
  to?: string;
  icon?: IconType;
  iconElement?: ReactElement;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children?: ReactChildren | ReactElement | string;
}

const LinkWrapper = ({ href, to, children, ...linkProps }) => {
  if (href != null) {
    return (
      <Link href={href} isExternal={true}>
        {children}
      </Link>
    );
  }
  if (to != null) {
    return (
      <RouterLink to={to} {...linkProps}>
        {children}
      </RouterLink>
    );
  }

  // No link
  return children;
};

/**
 * Custom menu item component
 *
 * Supports external links, internal routes, or onClick
 * Icon is optional, with alignment maintained either way
 */
export const IexMenuItem = ({
  href,
  to,
  icon,
  iconElement,
  children,
  onClick,
  ...linkProps
}: Props & Partial<LinkProps>) => {
  return (
    <LinkWrapper href={href} to={to} {...linkProps}>
      <MenuItem onClick={onClick}>
        {icon && <Icon as={icon} mr="1rem" />}
        {iconElement && <Box mr="1rem">{iconElement}</Box>}
        {!icon && !iconElement && <Square size="16px" mr="1rem" />}
        {children}
      </MenuItem>
    </LinkWrapper>
  );
};
