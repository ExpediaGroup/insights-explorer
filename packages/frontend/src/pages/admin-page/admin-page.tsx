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

import { Flex, Text, VStack } from '@chakra-ui/react';
import { Helmet } from 'react-helmet';
import { Route, Routes } from 'react-router-dom';

import { SettingsSection, SettingsSidebar } from '../../components/settings-sidebar/settings-sidebar';
import { ErrorPage } from '../error-page/error-page';

import { NewsAdmin } from './components/news-admin/news-admin';

const adminSections: SettingsSection[] = [{ label: "What's New", path: '/admin/news' }];

export const AdminPage = () => {
  return (
    <>
      <Helmet>
        <title>Administrative</title>
      </Helmet>

      <Flex direction="column" justify="stretch" flexGrow={2}>
        <Flex direction={{ base: 'column', md: 'row' }} mt="1rem" flexGrow={2}>
          <SettingsSidebar title="Admin" sections={adminSections} />

          <VStack align="stretch" flexGrow={2}>
            {/* Admin Subpages */}
            <Routes>
              <Route path="/news" element={<NewsAdmin />} />

              <Route path="/" element={<Text>Admin Only!</Text>} />
              <Route path="*" element={<ErrorPage />}></Route>
            </Routes>
          </VStack>
        </Flex>
      </Flex>
    </>
  );
};
