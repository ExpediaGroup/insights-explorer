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

import { Spinner, Text, VStack } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { gql } from 'urql';

import type { RootState } from '../../../store/store';
import { userSlice, login } from '../../../store/user.slice';
import { urqlClient } from '../../../urql';

export const AUTH_CALLBACK_PATH = '/auth/callback';
export const AUTH_ERROR_PATH = '/auth/error';

export const LOCAL_STORAGE_PREFIX = 'github-oauth-';

interface Props {
  children: JSX.Element;
}

const LoginCallback = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loggedIn } = useSelector((state: RootState) => state.user);

  const redirectUrl = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}redirectUrl`);

  if (redirectUrl) {
    console.log('Redirecting to', redirectUrl);
    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}redirectUrl`);
    navigate(redirectUrl);
  }

  useEffect(() => {
    const getAccessToken = async () => {
      if (searchParams.get('error')) {
        navigate('/auth/error', {
          state: {
            error: searchParams.get('error'),
            message: searchParams.get('error_description')
          }
        });
        return;
      }

      const code = searchParams.get('code');

      // Convert GitHub code to GitHub Access Token
      const response = await urqlClient
        .mutation(
          gql`
            mutation GetAccessToken($code: String!) {
              getAccessToken(code: $code)
            }
          `,
          { code }
        )
        .toPromise();

      if (response.error) {
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}accessToken`);
        navigate('/auth/error', { state: { error: response.error } });
      } else {
        console.log(`[GITHUB_AUTH_PROVIDER] Dispatching Login`);

        const accessToken = response.data.getAccessToken;

        // Login against the IEX service
        dispatch(userSlice.actions.setAccessToken(accessToken));
        dispatch(login(accessToken));
      }
    };

    if (loggedIn) {
      const postLoginUrl = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}postLoginUrl`);

      if (postLoginUrl) {
        console.log('Redirecting to', postLoginUrl);
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}postLoginUrl`);
        navigate(postLoginUrl, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      getAccessToken();
    }
  }, [dispatch, loggedIn, navigate, searchParams]);

  return (
    <>
      <VStack alignSelf="center" align="center">
        <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="frost.200" size="xl" />
        <Text>Logging in..</Text>
      </VStack>
    </>
  );
};

const AuthWrapper = ({ children }: Props) => {
  const { appSettings } = useSelector((state: RootState) => state.app);
  const { accessToken, loggedIn, requestingLogin } = useSelector((state: RootState) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (requestingLogin === true) {
      // We're handling it below!
      dispatch(userSlice.actions.requestLogin(false));
    }

    if (accessToken !== undefined) {
      // Already have an OAuth access token
      return;
    }

    const localStorageToken = window.localStorage.getItem(`${LOCAL_STORAGE_PREFIX}accessToken`);

    if (localStorageToken) {
      // Already have an access token in local storage,
      // Login against the IEX service
      dispatch(userSlice.actions.setAccessToken(localStorageToken));
      dispatch(login(localStorageToken));

      return;
    }

    if (appSettings !== null) {
      // OAuth Login
      const authSettings = appSettings.authSettings;
      const redirectUrl = `${window.location.origin}${AUTH_CALLBACK_PATH}`;

      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}postLoginUrl`, location.pathname);

      const url = `${authSettings.authorizeUrl}?client_id=${authSettings.clientId}&redirect_uri=${redirectUrl}&scope=${authSettings.scopes}`;
      window.location.href = url;
    }
  }, [accessToken, appSettings, children, dispatch, loggedIn, location, navigate, requestingLogin]);

  if (accessToken) {
    // Already have an OAuth access token
    // Render children
    return children;
  }

  return null;
};

export const GitHubAuthProvider = ({ children }: Props) => {
  return (
    <Routes>
      {/* OAuth Callback Route */}
      <Route path={AUTH_CALLBACK_PATH} element={<LoginCallback />} />

      {/* Everything else */}
      <Route path="*" element={<AuthWrapper>{children}</AuthWrapper>} />
    </Routes>
  );
};
