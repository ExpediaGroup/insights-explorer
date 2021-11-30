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
import { Security, LoginCallback } from '@okta/okta-react';
import { ReactChild, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, useNavigate } from 'react-router-dom';

import { RootState } from '../../store/store';
import { userSlice, login } from '../../store/user.slice';

export const AUTH_CALLBACK_PATH = '/auth/callback';
export const AUTH_ERROR_PATH = '/auth/error';

interface Props {
  children: ReactChild[];
}

const LoginHandler = () => {
  const dispatch = useDispatch();
  const { authState, authService } = useOktaAuth();

  // Watch Okta status and dispatch login/logout actions
  useEffect(() => {
    if (!authState.isAuthenticated) {
      console.log(`[AUTH_PROVIDER] Dispatching Logout`);
      dispatch(userSlice.actions.logout());
    } else {
      console.log(`[AUTH_PROVIDER] Dispatching Login`);
      // Login against the IEX service
      dispatch(login(authState.accessToken));
    }
  }, [authState, authService, dispatch]);

  return null;
};

const ConditionalOnPending = ({ children }) => {
  const { authState } = useOktaAuth();
  const [initialized, setInitialized] = useState(false);

  // console.log(`[AUTH_PROVIDER] AuthProvider Rendering`);

  // Delay rendering until Okta auth check is completed
  // This avoids triggering initial logout while Okta is still pending
  if (authState.isPending && !initialized) {
    // console.log(`[AUTH_PROVIDER] authState.isPending, returning null`);
    return null;
  }

  // Only initialize once
  // This avoids issues with refreshing Okta tokens causing
  // the component tree to recreate itself
  if (!initialized) {
    setInitialized(true);
  }

  return (
    <>
      <LoginHandler />

      <Routes>
        <Route path="/*" element={<>{children}</>} />
      </Routes>
    </>
  );
};

const CustomError = ({ error }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/auth/error', { state: { error } });
  });
  return null;
};

export const AuthProvider = (props: Props) => {
  const { appSettings } = useSelector((state: RootState) => state.app);

  if (appSettings !== null) {
    const okta = {
      clientId: appSettings.oktaSettings.clientId,
      issuer: appSettings.oktaSettings.issuer,
      redirectUri: `${window.location.origin}${AUTH_CALLBACK_PATH}`,
      scopes: ['openid', 'profile', 'email', 'groups'],
      pkce: false,
      tokenManager: {
        expireEarlySeconds: 60,
        autoRenew: true
      }
    };

    return (
      <Security {...okta}>
        <Routes>
          {/* OAuth Callback Route */}
          <Route path={AUTH_CALLBACK_PATH} element={<LoginCallback errorComponent={CustomError} />} />

          {/* Everything else */}
          <Route path="*" element={<ConditionalOnPending children={props.children} />} />
        </Routes>
      </Security>
    );
  }

  return null;
};
