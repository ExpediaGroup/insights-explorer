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

import { Box, IconButton, Icon, Menu, MenuButton, MenuList, Tooltip, forwardRef } from '@chakra-ui/react';
import type { ReactNode, ElementType } from 'react';

interface Props {
  'aria-label': string;
  bg?: string;
  color?: string;
  children: ReactNode;
  icon: ElementType;
  fontSize?: string;
  size?: string;
  tooltip: string;
  variant?: string;
}

const TooltipIcon = forwardRef(
  ({ bg, color, children, fontSize, icon, label, size, tooltip, variant, ...props }, ref) => {
    if (bg !== undefined) {
      return (
        <Box ref={ref} {...props}>
          <Tooltip label={tooltip} aria-label={label}>
            <IconButton bg={bg} color={color} fontSize={fontSize} size={size} variant={variant} aria-label={label}>
              {children}
            </IconButton>
          </Tooltip>
        </Box>
      );
    }

    return (
      <Box ref={ref} {...props}>
        <Tooltip label={tooltip} aria-label={label}>
          <IconButton color={color} fontSize={fontSize} size={size} variant={variant} aria-label={label}>
            {children}
          </IconButton>
        </Tooltip>
      </Box>
    );
  }
);

export const IconButtonMenu = ({
  'aria-label': ariaLabel,
  bg,
  color = 'black',
  children,
  icon,
  fontSize,
  size,
  tooltip,
  variant = 'ghost'
}: Props) => {
  return (
    <Menu>
      <MenuButton
        as={TooltipIcon}
        bg={bg}
        color={color}
        fontSize={fontSize}
        icon={icon}
        label={ariaLabel}
        size={size}
        tooltip={tooltip}
        variant={variant}
      >
        <Icon as={icon} aria-label={ariaLabel} />
      </MenuButton>
      <MenuList zIndex="10">{children}</MenuList>
    </Menu>
  );
};
