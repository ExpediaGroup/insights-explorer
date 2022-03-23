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

import { Badge, Drawer, DrawerOverlay, useDisclosure } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IexMenuItem } from '../../../../../../components/iex-menu-item/iex-menu-item';
import { iconFactory } from '../../../../../../shared/icon-factory';
import { appSlice } from '../../../../../../store/app.slice';
import type { RootState } from '../../../../../../store/store';

import { NewsDrawerContents } from './components/news-drawer-contents/news-drawer-contents';

/**
 * This component provides a popout drawer containing recent news announcements.
 * It renders as an Menu item trigger which launches the drawer.
 *
 * (There is currently no way to open the drawer independently, as it's tied
 * directly to the menu item trigger)
 */
export const NewsDrawer = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const dispatch = useDispatch();
  const { isNewsUnread } = useSelector((state: RootState) => state.app);

  useEffect(() => {
    if (isOpen) {
      dispatch(appSlice.actions.readNews());
    }
  }, [dispatch, isOpen]);

  return (
    <>
      <IexMenuItem icon={iconFactory('news')} onClick={onOpen}>
        <>
          What's New
          {isNewsUnread && (
            <Badge bg="aurora.500" ml="0.25rem">
              New
            </Badge>
          )}
        </>
      </IexMenuItem>

      <Drawer placement="right" size="xs" isOpen={isOpen} onClose={onClose}>
        <DrawerOverlay>
          <NewsDrawerContents />
        </DrawerOverlay>
      </Drawer>
    </>
  );
};
