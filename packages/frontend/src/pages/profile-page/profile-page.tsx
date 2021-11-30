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

import { Flex, Spinner } from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { useUser } from '../../shared/useUser';
import { RootState } from '../../store/store';
import { ProfileNotFoundPage } from '../profile-not-found-page/profile-not-found-page';

import { UserProfile } from './components/user-profile/user-profile';

export const ProfilePage = () => {
  const { userInfo } = useSelector((state: RootState) => state.user);
  const { userName } = useParams();

  const [{ user, error, fetching }] = useUser({
    userName: userName ?? '',
    query: 'profile'
  });

  if (user && user.email === userInfo?.email) {
    // Manually calculate this value to avoid requerying the API
    user.isSelf = true;
  }

  return (
    <Flex direction="column" justify="stretch" flexGrow={2}>
      {error && <p>Oh no... {error.message}</p>}
      {fetching && <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />}
      {!fetching && user && <UserProfile user={user} />}
      {!fetching && user === null && <ProfileNotFoundPage />}
    </Flex>
  );
};
