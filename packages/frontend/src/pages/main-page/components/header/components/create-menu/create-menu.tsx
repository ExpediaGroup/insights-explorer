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

import { Box, Button, Menu, MenuButton, MenuList, Tooltip, forwardRef } from '@chakra-ui/react';
import { nanoid } from 'nanoid';

import { IexMenuItem } from '../../../../../../components/iex-menu-item/iex-menu-item';
import { ItemTypeIcon } from '../../../../../../components/item-type-icon/item-type-icon';
import { iconFactoryAs } from '../../../../../../shared/icon-factory';

const TooltipButton = forwardRef(({ ...props }, ref) => {
  return (
    <Box ref={ref} {...props}>
      <Tooltip label="Create a new Insight, Page, or Template" aria-label="Create New Dropdown Menu">
        <Button variant="frost" rightIcon={iconFactoryAs('chevronDown')}>
          Create New
        </Button>
      </Tooltip>
    </Box>
  );
});

export const CreateMenu = () => {
  return (
    <Menu>
      <MenuButton as={TooltipButton} />
      <MenuList zIndex="10">
        <IexMenuItem
          to="/create/insight"
          state={{ random: nanoid() }}
          iconElement={<ItemTypeIcon itemType="insight" />}
        >
          Insight
        </IexMenuItem>
        <IexMenuItem to="/create/page" state={{ random: nanoid() }} iconElement={<ItemTypeIcon itemType="page" />}>
          Page
        </IexMenuItem>
        <IexMenuItem
          to="/create/template"
          state={{ random: nanoid() }}
          iconElement={<ItemTypeIcon itemType="template" />}
        >
          Template
        </IexMenuItem>
      </MenuList>
    </Menu>
  );
};
