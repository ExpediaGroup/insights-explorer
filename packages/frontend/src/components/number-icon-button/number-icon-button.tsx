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

import { Badge, Box, Button, IconButton, Tooltip } from '@chakra-ui/react';
import { ReactElement } from 'react';

interface Props {
  color?: string;
  icon: ReactElement;
  isDisabled?: boolean;
  isLoading?: boolean;
  label: string;
  number?: number;
  onClick?: () => void;
  size?: string;
  tooltip?: boolean;
  variant?: string;
}

export const NumberIconButton = ({
  color,
  icon,
  isDisabled = false,
  isLoading = false,
  label,
  number,
  onClick,
  size,
  tooltip = true,
  variant = 'ghost'
}: Props) => {
  return (
    <Tooltip hidden={!tooltip} placement="bottom" label={label} aria-label={label}>
      <Box>
        {number == null && (
          <IconButton
            variant={variant}
            color={color}
            aria-label={label}
            icon={icon}
            onClick={onClick}
            isLoading={isLoading}
            isDisabled={isDisabled}
            size={size}
          />
        )}
        {number != null && (
          <Button
            variant={variant}
            color={color}
            aria-label={label}
            leftIcon={icon}
            onClick={onClick}
            isLoading={isLoading}
            isDisabled={isDisabled}
            size={size}
          >
            <Badge bg="transparent">{number}</Badge>
          </Button>
        )}
      </Box>
    </Tooltip>
  );
};
