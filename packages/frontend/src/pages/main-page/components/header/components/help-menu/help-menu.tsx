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

import { MenuGroup, MenuDivider } from '@chakra-ui/react';
import { useSelector } from 'react-redux';

import { IconButtonMenu } from '../../../../../../components/icon-button-menu/icon-button-menu';
import { IexMenuItem } from '../../../../../../components/iex-menu-item/iex-menu-item';
import { chatIcon } from '../../../../../../shared/chat-icon';
import { iconFactory } from '../../../../../../shared/icon-factory';
import { RootState } from '../../../../../../store/store';
import { AboutModal } from '../../../about-modal/about-modal';
import { NewsDrawer } from '../news-drawer/news-drawer';

export const HelpMenu = () => {
  const { appSettings, isNewsUnread } = useSelector((state: RootState) => state.app);

  return (
    <IconButtonMenu
      aria-label="Help menu"
      icon={isNewsUnread ? iconFactory('news') : iconFactory('help')}
      tooltip="Help"
      bg={isNewsUnread ? 'aurora.500' : undefined}
    >
      <MenuGroup title="Help">
        <NewsDrawer />

        <IexMenuItem to="/help" icon={iconFactory('help')}>
          Help
        </IexMenuItem>

        {appSettings?.externalBlogUrl && (
          <IexMenuItem href={appSettings.externalBlogUrl} icon={iconFactory('rss')}>
            Blog
          </IexMenuItem>
        )}

        {appSettings?.externalDocUrl && (
          <IexMenuItem href={appSettings.externalDocUrl} icon={iconFactory('linkExternal')}>
            External Docs
          </IexMenuItem>
        )}

        {appSettings?.externalVideosUrl && (
          <IexMenuItem href={appSettings.externalVideosUrl} icon={iconFactory('video')}>
            Videos
          </IexMenuItem>
        )}

        {appSettings?.chatSettings && (
          <IexMenuItem href={appSettings.chatSettings.url} icon={chatIcon(appSettings.chatSettings.provider)}>
            {appSettings.chatSettings.channel}
          </IexMenuItem>
        )}

        <AboutModal appSettings={appSettings} />
      </MenuGroup>

      <MenuDivider />

      <MenuGroup title={`Version ${appSettings?.version}`}>
        <IexMenuItem to="/changelog" icon={iconFactory('code')}>
          Changelog
        </IexMenuItem>

        {appSettings?.iexScmUrl && (
          <IexMenuItem href={appSettings.iexScmUrl} icon={iconFactory('github')}>
            Source
          </IexMenuItem>
        )}
      </MenuGroup>
    </IconButtonMenu>
  );
};
