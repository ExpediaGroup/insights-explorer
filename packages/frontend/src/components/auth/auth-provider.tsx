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
import { Routes, Route } from 'react-router-dom';

import { AuthErrorPage } from '../../pages/auth-error-page/auth-error-page';
import type { RootState } from '../../store/store';

import { GitHubAuthProvider } from './github-auth-provider/github-auth-provider';
import { OktaAuthProvider } from './okta-auth-provider/okta-auth-provider';

export const AUTH_CALLBACK_PATH = '/auth/callback';
export const AUTH_ERROR_PATH = '/auth/error';

const getAuthProviderComponent = (authProvider: string | undefined, children: any) => {
  switch (authProvider) {
    case 'github': {
      return <GitHubAuthProvider children={children} />;
    }

    case 'okta': {
      return <OktaAuthProvider children={children} />;
    }

    default: {
      // TODO: Handle other auth strategies
      return null;
    }
  }
};

export const AuthProvider = ({ children }) => {
  const { appSettings } = useSelector((state: RootState) => state.app);
  const authSettings = appSettings?.authSettings;

  const authProviderComponent = getAuthProviderComponent(authSettings?.provider, children);

  return (
    <Routes>
      {/* Authentication errors can be displayed without being logged in */}
      <Route path={AUTH_ERROR_PATH} element={<AuthErrorPage />} />

      {/* Everything else */}
      <Route path="*" element={authProviderComponent} />
    </Routes>
  );
};
