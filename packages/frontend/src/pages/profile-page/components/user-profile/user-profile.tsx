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

import { Box, Flex, Icon, Tab, Tabs, TabList, TabPanel, TabPanels, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';

import { User } from '../../../../models/generated/graphql';
import { iconFactory } from '../../../../shared/icon-factory';

import { UserAbout } from './components/user-about/user-about';
import { UserActivity } from './components/user-activity/user-activity';
import { UserDrafts } from './components/user-drafts/user-drafts';
import { UserInsights } from './components/user-insights/user-insights';
import { UserSidebar } from './components/user-sidebar/user-sidebar';

interface Props {
  user: User;
}

const tabs = [
  { label: 'About Me', path: '' },
  { label: 'Activity', path: 'activity' },
  { label: 'Authored Insights', path: 'insights' },
  { label: 'Liked Insights', path: 'likes' },
  { label: 'Drafts', path: 'drafts', selfOnly: true }
];

const pathToIndex = (path): number => {
  const tab = tabs.findIndex((tab) => tab.path === path);
  return tab < 0 ? 0 : tab;
};

export const UserProfile = ({ user }: Props) => {
  const navigate = useNavigate();
  const { '*': currentTab } = useParams();

  const [tabIndex, setTabIndex] = useState(pathToIndex(currentTab));

  if (user == null) {
    return <Box></Box>;
  }

  if (!user.isSelf && tabs[tabIndex].selfOnly === true) {
    // Deeplink to a self-only tab; redirect to the first tab
    setTabIndex(0);
  }

  const handleTabsChange = (index) => {
    navigate(tabs[index].path, { replace: true });
    setTabIndex(index);
  };

  return (
    <>
      <Helmet>
        <title>{user.displayName}</title>
      </Helmet>

      <Flex direction={{ base: 'column-reverse', md: 'row' }} align="stretch" m="-0.5rem">
        <VStack align="stretch" flexGrow={2} overflow="auto" mt="3rem" p="0.5rem">
          <Tabs isLazy variant="soft-rounded" colorScheme="nord8" index={tabIndex} onChange={handleTabsChange}>
            <TabList flexWrap="wrap">
              {tabs.map((tab) => {
                if (user.isSelf !== true && tab.selfOnly === true) {
                  return null;
                }

                return (
                  <Tab key={tab.label} _selected={{ bg: 'frost.200' }}>
                    {tab.selfOnly && <Icon as={iconFactory('secure')} mr="0.5rem" />}
                    {tab.label}
                  </Tab>
                );
              })}
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <UserAbout user={user} />
              </TabPanel>
              <TabPanel>
                <UserActivity user={user} />
              </TabPanel>
              <TabPanel>
                <UserInsights user={user} insightConnection={user.authoredInsights} />
              </TabPanel>
              <TabPanel>
                <UserInsights user={user} insightConnection={user.likedInsights} />
              </TabPanel>
              {user.isSelf && (
                <TabPanel px={0}>
                  <UserDrafts user={user} />
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </VStack>

        <UserSidebar user={user} />
      </Flex>
    </>
  );
};
