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

import { useLocation } from 'react-router-dom';

import { iconFactory } from '../../shared/icon-factory';
import { ErrorPage } from '../error-page/error-page';
interface AuthError {
  name: string;
  message: string;
  errorCode: string;
}

export const AuthErrorPage = () => {
  const location = useLocation();
  const state = location.state as { error: AuthError };
  const error = state?.error;

  const props = {
    icon: iconFactory('authenticationError'),
    heading: 'Oops',
    errorCode: 'Authentication Error',
    message: <>We couldn't log you in successfully.</>
  };

  if (error?.errorCode === 'access_denied') {
    props.heading = "Don't Panic!";
    props.message = <>You aren't assigned to this application in Okta. Please open your Okta dashboard and add it.</>;
  }

  return <ErrorPage {...props} />;
};
