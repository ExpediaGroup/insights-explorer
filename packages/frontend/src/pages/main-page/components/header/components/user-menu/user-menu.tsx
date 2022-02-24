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

import { Avatar, Icon, Menu, MenuButton, MenuDivider, MenuGroup, MenuList, MenuItem, Spinner } from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';

import { IexMenuItem } from '../../../../../../components/iex-menu-item/iex-menu-item';
import { iconFactory, iconFactoryAs } from '../../../../../../shared/icon-factory';
import { RootState } from '../../../../../../store/store';
import { LoginState, userSlice } from '../../../../../../store/user.slice';

export const UserMenu = () => {
  const { userInfo, loginState } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  const requestLogin = () => dispatch(userSlice.actions.requestLogin(true));

  return (
    <Menu>
      <MenuButton boxSize="32px" justifyContent="center" alignItems="center">
        {loginState === LoginState.LOGGING_IN && <Spinner label="Loading..." size="sm" />}
        {loginState === LoginState.LOGGED_IN && (
          <Avatar name={userInfo?.displayName} src={userInfo?.avatarUrl} size="sm" />
        )}
        {loginState === LoginState.LOGGED_OUT && (
          <Avatar
            size="sm"
            bg="transparent"
            color="snowstorm.50"
            icon={iconFactoryAs('user', { 'aria-label': 'User Menu', fontSize: '32px' })}
          />
        )}
      </MenuButton>
      <MenuList zIndex="10">
        {loginState !== LoginState.LOGGED_IN && (
          <MenuItem onClick={requestLogin} isDisabled={loginState === LoginState.LOGGING_IN}>
            <Icon as={iconFactory('login')} mr="0.5rem" />
            Login
          </MenuItem>
        )}
        {loginState === LoginState.LOGGED_IN && (
          <MenuGroup title={`${userInfo?.displayName} ${userInfo?.isAdmin ? '👑' : ''}`}>
            <IexMenuItem to={`/profile/${userInfo?.userName}`} icon={iconFactory('profile')}>
              Profile
            </IexMenuItem>
            <IexMenuItem to={`/profile/${userInfo?.userName}/drafts`} icon={iconFactory('draft')}>
              Drafts
            </IexMenuItem>
            <MenuDivider />
            <IexMenuItem to={`/settings`} icon={iconFactory('settings')}>
              Settings
            </IexMenuItem>
            {userInfo?.isAdmin && (
              <>
                <MenuDivider />
                <IexMenuItem to={`/admin`} icon={iconFactory('admin')}>
                  Admin
                </IexMenuItem>
              </>
            )}
          </MenuGroup>
        )}
      </MenuList>
    </Menu>
  );
};
