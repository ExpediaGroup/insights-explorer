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

import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import { useOktaAuth } from '@okta/okta-react';
import { Security, LoginCallback } from '@okta/okta-react';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, useNavigate } from 'react-router-dom';

import type { AppDispatch, RootState } from '../../../store/store';
import { userSlice, login } from '../../../store/user.slice';

export const AUTH_CALLBACK_PATH = '/auth/callback';
export const AUTH_ERROR_PATH = '/auth/error';

interface Props {
  children: JSX.Element;
}

const AuthWrapper = ({ children }: Props) => {
  const { authState, oktaAuth } = useOktaAuth();
  const { requestingLogin } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();

  const loggingIn = useRef(false);

  // Watch Okta status and dispatch login/logout actions
  useEffect(() => {
    if (!authState) {
      return;
    }

    if (requestingLogin === true) {
      // We're handling it below!
      loggingIn.current = false;
      dispatch(userSlice.actions.requestLogin(false));
    }

    // Delay rendering until Okta auth check is completed
    // This avoids triggering another login while Okta is still pending
    if (authState.isPending) {
      return;
    }

    if (authState.isAuthenticated) {
      // Okta already logged in
      // Login against the IEX service
      if (authState.accessToken && loggingIn.current === false) {
        loggingIn.current = true;
        dispatch(login(authState.accessToken.accessToken));
      }
    } else {
      // Trigger Okta Login
      oktaAuth.signInWithRedirect({ originalUri: window.location.href });
    }
  }, [authState, dispatch, requestingLogin, oktaAuth]);

  if (authState?.isAuthenticated) {
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
  const navigate = useNavigate();

  const restoreOriginalUri = async (_oktaAuth, originalUri) => {
    navigate(toRelativeUrl(originalUri, window.location.origin));
  };

  if (appSettings !== null) {
    const oidcConfig = {
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

    const oktaAuth = new OktaAuth(oidcConfig);

    return (
      <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
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
