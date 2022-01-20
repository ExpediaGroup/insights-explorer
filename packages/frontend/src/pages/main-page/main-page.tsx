/**
 * Copyright 2022 Expedia, Inc.
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

import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AUTH_ERROR_PATH } from '../../components/auth-provider/auth-provider';
import { SecureRoute } from '../../components/secure-route/secure-route';
import { useSimpleSearchParams } from '../../shared/useSimpleSearchParams';
import { ActivityPage } from '../activity-page/activity-page';
import { AdminPage } from '../admin-page/admin-page';
import { AuthErrorPage } from '../auth-error-page/auth-error-page';
import { ChangelogPage } from '../changelog-page/changelog-page';
import { ErrorPage } from '../error-page/error-page';
import { HelpPage } from '../help-page/help-page';
import { InsightDraftSwitcher } from '../insight-editor/insight-draft-switcher';
import { InsightPage } from '../insight-page/insight-page';
import { ProfilePage } from '../profile-page/profile-page';
import { SearchPage } from '../search-page/search-page';
import { SettingsPage } from '../settings-page/settings-page';

import { Footer } from './components/footer/footer';
import { Header } from './components/header/header';
import { PrintHeader } from './components/print-header/print-header';

export const MainPage = () => {
  // console.log('Rendering MainPage');
  // useEffect(() => {
  //   return () => {
  //     console.log('>> MainPage Unmounted <<');
  //   };
  // }, []);

  const { export: isExport, print: isPrint } = useSimpleSearchParams<{ export?: string; print?: string }>();

  const backgroundColor = useColorModeValue('nord.100', '#555');

  if (isExport !== undefined) {
    return (
      <>
        {isPrint !== undefined && <PrintHeader />}

        <Box as="section" p={{ base: '1rem', md: '2rem' }} pt="1rem" minHeight="100vh" bg={backgroundColor}>
          <SecureRoute>
            <Routes>
              {/* Insight Viewing */}
              <Route path="/insight/:owner/:name/*" element={<InsightPage isExport={true} />} />
              <Route path="/page/:owner/:name/*" element={<InsightPage isExport={true} />} />
              <Route path="/template/:owner/:name/*" element={<InsightPage isExport={true} />} />

              <Route path="*" element={<ErrorPage />} />
            </Routes>
          </SecureRoute>
        </Box>
      </>
    );
  }

  return (
    <Flex as="section" direction="column" minHeight="100vh" bg={backgroundColor}>
      <Header />
      <Flex as="main" flexGrow={1} direction="column" p={{ base: '1rem', md: '2rem' }} pt={0}>
        <Routes>
          {/* Authentication errors can be displayed without being logged in */}
          <Route path={AUTH_ERROR_PATH} element={<AuthErrorPage />} />

          {/* All other routes are secured */}
          <Route
            path="/admin/*"
            element={
              <SecureRoute adminOnly={true}>
                <AdminPage />
              </SecureRoute>
            }
          />

          <Route
            path="/"
            element={
              <SecureRoute>
                <Outlet />
              </SecureRoute>
            }
          >
            {/* Search */}
            <Route path="/search">
              <Route path="" element={<SearchPage />} />
              <Route path=":query" element={<SearchPage />} />
            </Route>

            {/* User Management */}
            <Route path="/profile/:userName/*" element={<ProfilePage />} />
            <Route path="/settings/*" element={<SettingsPage />} />

            {/* Insight Viewing */}
            {/* Each itemType has a unique route for aesthetics, but they are interchangeable */}
            <Route path="/insight/:owner/:name/*" element={<InsightPage />} />
            <Route path="/page/:owner/:name/*" element={<InsightPage />} />
            <Route path="/template/:owner/:name/*" element={<InsightPage />} />

            {/* Editing */}
            <Route path="/edit/*" element={<InsightDraftSwitcher insight={null} onRefresh={undefined} />} />

            {/* Create endpoints redirect to editor (necessary for deeplinking with state) */}
            <Route path="/create/insight" element={<Navigate to="/edit" state={{ itemType: 'insight' }} />} />
            <Route path="/create/page" element={<Navigate to="/edit" state={{ itemType: 'page' }} />} />
            <Route path="/create/template" element={<Navigate to="/edit" state={{ itemType: 'template' }} />} />

            <Route path="/activities">
              <Route path="" element={<ActivityPage />} />
              <Route path=":query" element={<ActivityPage />} />
            </Route>

            {/* Default Routes */}
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route path="/help/*" element={<HelpPage />} />

            <Route path="/" element={<Navigate to="/search" />} />
            <Route path="*" element={<ErrorPage />}></Route>
          </Route>
        </Routes>
      </Flex>
      <Footer />
    </Flex>
  );
};
