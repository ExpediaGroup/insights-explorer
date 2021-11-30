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

import {
  Badge,
  Box,
  Button,
  Divider,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  VStack,
  forwardRef
} from '@chakra-ui/react';

import { iconFactoryAs } from '../../shared/icon-factory';

const TooltipButton = forwardRef(({ permission, ...props }, ref) => {
  return (
    <Box ref={ref} {...props}>
      <Tooltip label="Create a new Insight, Page, or Template" aria-label="Create New Dropdown Menu">
        <Button variant="ghost" rightIcon={iconFactoryAs('chevronDown')}>
          <Badge>{permission}</Badge>
        </Button>
      </Tooltip>
    </Box>
  );
});

const availablePermissions = [
  {
    name: 'WRITE',
    description: 'Can publish changes to this Insight.'
  },
  {
    name: 'ADMIN',
    description: 'Can publish changes to this Insight, manage collaborators, and delete the Insight.'
  }
];

export const PermissionMenu = ({ permission, onChange, isDisabled = false }) => {
  return (
    <Menu closeOnSelect={true}>
      {({ onClose }) => (
        <>
          <MenuButton as={TooltipButton} permission={permission} />
          <MenuList zIndex="10" maxW="20rem">
            {availablePermissions.map((p, i) => (
              <>
                {i > 0 && <Divider />}
                <MenuItem
                  isDisabled={isDisabled}
                  onClick={() => {
                    onChange(p.name);
                    onClose();
                  }}
                >
                  <VStack align="flex-start">
                    <Badge>{p.name}</Badge>
                    <Text fontSize="sm">{p.description}</Text>
                  </VStack>
                </MenuItem>
              </>
            ))}
          </MenuList>
        </>
      )}
    </Menu>
  );
};
