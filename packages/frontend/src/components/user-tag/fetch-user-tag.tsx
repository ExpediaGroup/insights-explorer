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

import { BoxProps } from '@chakra-ui/react';
import { memo } from 'react';

import { User } from '../../models/generated/graphql';
import { useUser } from '../../shared/useUser';

import { UserTag, UserTagProps } from './user-tag';

type Props = Omit<UserTagProps, 'user'> & { userName: string };

/**
 * Wrapper for `UserTag` that retrieves a user via userName.
 *
 * If the user cannot be found, the userName is displayed instead.
 * If any errors occur, they are suppressed.
 */
export const FetchUserTag = memo(({ userName, ...props }: Props & Omit<BoxProps, 'children'>) => {
  const [{ user, error, fetching }] = useUser({
    userName
  });

  if (fetching) {
    return <UserTag isLoading={true} {...props} />;
  }

  if (error) {
    return null;
  } else if (user === null) {
    return <UserTag user={{ userName, displayName: userName } as User} {...props} />;
  } else {
    return <UserTag user={user} {...props} />;
  }
});
