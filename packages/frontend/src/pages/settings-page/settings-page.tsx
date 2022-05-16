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

import { Box, Flex, Icon, Spinner, Text, useToast, VStack } from '@chakra-ui/react';
import { Helmet } from 'react-helmet';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useQuery, useMutation, gql } from 'urql';

import { Alert } from '../../components/alert/alert';
import { Link } from '../../components/link/link';
import type { SettingsSection } from '../../components/settings-sidebar/settings-sidebar';
import { SettingsSidebar } from '../../components/settings-sidebar/settings-sidebar';
import { iconFactory } from '../../shared/icon-factory';
import type { AppDispatch, RootState } from '../../store/store';
import { executeHealthCheck, userSlice } from '../../store/user.slice';
import { ErrorPage } from '../error-page/error-page';

import { GitHubSettings } from './components/github-settings/github-settings';
import { InsightsSettings } from './components/insights-settings/insights-settings';
import { ProfileSettings } from './components/profile-settings/profile-settings';
import { SystemSettings } from './components/system-settings/system-settings';

const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    avatarUrl
    userName
    email
    displayName
    currentStatus
    githubPersonalAccessToken
    locale
    location
    title
    team
    chatHandle
    bio
    skills
    readme
    defaultTemplateId
    featureFlags
  }
`;

const CURRENT_USER_QUERY = gql`
  ${USER_FRAGMENT}
  query CurrentUser {
    currentUser {
      ...UserFields
    }
  }
`;

const UPDATE_USER_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation UpdateUser($user: UpdateUserInput!) {
    updateUser(user: $user) {
      ...UserFields
    }
  }
`;

const settingSections: SettingsSection[] = [
  { label: 'Profile', path: '/settings/profile' },
  { label: 'Insights', path: '/settings/insights' },
  { label: 'GitHub Integration', path: '/settings/github' },
  // { label: 'Notifications', path: '/settings/notifications' },
  { label: 'System', path: '/settings/system' }
];

export const SettingsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { userInfo } = useSelector((state: RootState) => state.user);

  const [{ data, fetching, error }] = useQuery({
    query: CURRENT_USER_QUERY,
    pause: userInfo == null
  });

  const [updateUserResult, updateUser] = useMutation(UPDATE_USER_MUTATION);
  const { error: updateError, fetching: updateFetching } = updateUserResult;
  const toast = useToast();

  const onSubmit = async (data) => {
    // The API does an upsert with any provided fields,
    // so each settings page can be submitted independently
    await updateUser({ user: data }).then((result) => {
      if (result.error) {
        toast({
          position: 'bottom-right',
          title: 'Unable to save.',
          status: 'error',
          duration: 9000,
          isClosable: true
        });
        return;
      }

      // Update store with latest user info
      dispatch(userSlice.actions.setUserInfo(result.data.updateUser));
      dispatch(executeHealthCheck());

      toast({
        position: 'bottom-right',
        title: 'Settings saved.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    });
  };

  const user = data?.currentUser || null;

  return (
    <>
      <Helmet>
        <title>Settings</title>
      </Helmet>

      <Flex direction="column" justify="stretch" flexGrow={2}>
        {error && <Alert error={error} mb="1rem" />}
        {updateError && <Alert error={updateError} mb="1rem" />}

        <Flex direction={{ base: 'column', md: 'row' }} mt="1rem" flexGrow={2}>
          <SettingsSidebar
            sections={settingSections}
            bottomContent={
              <Box pt="3rem">
                <Link to={`/profile/${userInfo?.userName}`} display="flex" alignItems="center">
                  <Icon as={iconFactory('arrowLeft')} mr="0.5rem" color="frost.300" />
                  <Text>View Profile</Text>
                </Link>
              </Box>
            }
          />
          {fetching && <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />}
          {!fetching && user && (
            <VStack align="stretch" flexGrow={2}>
              {/* Settings Subpages */}
              <Routes>
                <Route
                  path="/profile"
                  element={<ProfileSettings user={user} onSubmit={onSubmit} isSubmitting={updateFetching} />}
                />
                <Route
                  path="/insights"
                  element={<InsightsSettings user={user} onSubmit={onSubmit} isSubmitting={updateFetching} />}
                />
                <Route
                  path="/github"
                  element={<GitHubSettings user={user} onSubmit={onSubmit} isSubmitting={updateFetching} />}
                />
                <Route
                  path="/system"
                  element={<SystemSettings user={user} onSubmit={onSubmit} isSubmitting={updateFetching} />}
                />

                <Route path="/" element={<Navigate to="profile" replace={true} />} />
                <Route path="*" element={<ErrorPage />}></Route>
              </Routes>
            </VStack>
          )}
        </Flex>
      </Flex>
    </>
  );
};
