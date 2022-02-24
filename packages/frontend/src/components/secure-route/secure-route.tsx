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

import { useSelector } from 'react-redux';

import { NotAllowedPage } from '../../pages/not-allowed-page/not-allowed-page';
import { RootState } from '../../store/store';
import { LoginState } from '../../store/user.slice';

/**
 * This component will only render children if the user is authenticated.
 *
 * Additionally, admin-only pages will only render if the user is an admin.
 */
export const SecureRoute = ({ children, adminOnly = false, ...props }) => {
  const userState = useSelector((state: RootState) => state.user);

  // Not logged in, render nothing
  if (userState?.loginState !== LoginState.LOGGED_IN) {
    return null;
  }

  // Admin only, but not admin, render not allowed page
  if (adminOnly && userState?.userInfo?.isAdmin !== true) {
    return <NotAllowedPage />;
  }

  // Render children
  return children;
};
