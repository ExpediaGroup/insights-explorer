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

import { useOktaAuth } from '@okta/okta-react';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { NotAllowedPage } from '../../pages/not-allowed-page/not-allowed-page';
import { RootState } from '../../store/store';
import { LoginState } from '../../store/user.slice';

/**
 * This component will only render children if the user is authenticated
 */
export const SecureRoute = ({ children, adminOnly = false, ...props }) => {
  const userState = useSelector((state: RootState) => state.user);
  const { authService, authState } = useOktaAuth();
  const pendingLogin = useRef(false);
  const alreadyRendered = useRef(false);

  useEffect(() => {
    const handleLogin = async () => {
      if (pendingLogin.current) {
        return;
      }

      pendingLogin.current = true;

      // console.log('[SECURE_ROUTE] Triggering Login');
      // Trigger Okta login
      // Successful Okta login will trigger IEX login
      const fromUri = window.location.href;
      authService.login(fromUri);
    };

    if (authState.isAuthenticated && userState.loginState === LoginState.LOGGED_IN) {
      pendingLogin.current = false;
      return;
    }

    // Start login if app has decided it is not logged in and there is no pending signin
    if (!authState.isAuthenticated && !authState.isPending) {
      // console.log('[SECURE_ROUTE] Running handleLogin()');
      handleLogin();
    }
  }, [authService, authState.isAuthenticated, authState.isPending, userState.loginState]);

  if (alreadyRendered.current) {
    // Route was already rendered, so only hide it if the user is actually logged out
    if (userState.loginState === LoginState.LOGGED_OUT) {
      // console.log('[SECURE_ROUTE] Route already rendered, but user is logged out = return null');
      return null;
    }
  } else {
    // Route never rendered, so wait until both Okta / IEX login completed
    if (!authState.isAuthenticated || !userState.loggedIn) {
      // console.log('[SECURE_ROUTE] Route never rendered, user not authenticated / loggedIn');
      return null;
    }
  }

  if (adminOnly && userState?.userInfo?.isAdmin !== true) {
    return <NotAllowedPage />;
  }

  alreadyRendered.current = true;

  return children;
};
