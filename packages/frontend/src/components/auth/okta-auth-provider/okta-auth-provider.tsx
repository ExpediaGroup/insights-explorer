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

import { useOktaAuth } from '@okta/okta-react';
import { Security, LoginCallback } from '@okta/okta-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, useNavigate } from 'react-router-dom';

import { RootState } from '../../../store/store';
import { userSlice, login } from '../../../store/user.slice';

export const AUTH_CALLBACK_PATH = '/auth/callback';
export const AUTH_ERROR_PATH = '/auth/error';

interface Props {
  children: JSX.Element;
}

const AuthWrapper = ({ children }: Props) => {
  const { authState, authService } = useOktaAuth();
  const { requestingLogin } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  // Watch Okta status and dispatch login/logout actions
  useEffect(() => {
    if (requestingLogin === true) {
      // We're handling it below!
      dispatch(userSlice.actions.requestLogin(false));
    }

    // Delay rendering until Okta auth check is completed
    // This avoids triggering another login while Okta is still pending
    if (authState.isPending) {
      return;
    }

    if (!authState.isAuthenticated) {
      // Trigger Okta Login
      authService.login(window.location.href);
    } else {
      // Okta already logged in
      // Login against the IEX service
      dispatch(login(authState.accessToken));
    }
  }, [authState, authService, dispatch, requestingLogin]);

  if (authState.isAuthenticated) {
    // Already logged into Okta
    return children;
  }

  return null;
};

const CustomError = ({ error }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/auth/error', { state: { error } });
  });
  return null;
};

export const OktaAuthProvider = ({ children }: Props) => {
  const { appSettings } = useSelector((state: RootState) => state.app);

  if (appSettings !== null) {
    const okta = {
      clientId: appSettings.authSettings.clientId,
      issuer: appSettings.authSettings.issuer,
      redirectUri: `${window.location.origin}${AUTH_CALLBACK_PATH}`,
      scopes: appSettings.authSettings.scopes.split(','),
      pkce: appSettings.authSettings.pkceEnabled,
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
          <Route path="*" element={<AuthWrapper>{children}</AuthWrapper>} />
        </Routes>
      </Security>
    );
  }

  return null;
};
