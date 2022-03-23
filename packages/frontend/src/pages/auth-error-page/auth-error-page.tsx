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

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { iconFactory } from '../../shared/icon-factory';
import { RootState } from '../../store/store';
import { ErrorPage } from '../error-page/error-page';

interface AuthError {
  name: string;
  message: string;
  errorCode: string;
}

export const AuthErrorPage = () => {
  const { requestingLogin } = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { error: AuthError; message?: string };
  const error = state?.error;

  useEffect(() => {
    // If user requests a login we need to redirect away from the error page
    if (requestingLogin === true) {
      navigate('/');
    }
  }, [navigate, requestingLogin]);

  const props = {
    icon: iconFactory('authenticationError'),
    heading: 'Oops',
    errorCode: 'Authentication Error',
    message: state?.message ? <>{state.message}</> : <>We couldn't log you in successfully.</>
  };

  if (error?.errorCode === 'access_denied') {
    props.heading = "Don't Panic!";

    if (state?.message === undefined) {
      props.message = <>You aren't assigned to this application in Okta. Please open your Okta dashboard and add it.</>;
    }
  }

  return <ErrorPage {...props} />;
};
