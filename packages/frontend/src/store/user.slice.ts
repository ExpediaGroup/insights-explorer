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

import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { gql } from 'urql';

import { LOCAL_STORAGE_PREFIX } from '../components/auth/github-auth-provider/github-auth-provider';
import type { User, UserHealthCheck } from '../models/generated/graphql';
import { urqlClient, enableAuthorization, disableAuthorization } from '../urql';

export enum LoginState {
  LOGGED_OUT = 'LOGGED_OUT',
  LOGGING_IN = 'LOGGING_IN',
  LOGGED_IN = 'LOGGED_IN'
}

export interface UserState {
  accessToken: string | undefined;
  loggedIn: boolean;
  loginState: LoginState;
  loginError?: string;
  userInfo: Partial<User> | null;
  healthCheck?: UserHealthCheck;
  requestingLogin: boolean;
}

const initialState: UserState = {
  accessToken: undefined,
  loggedIn: false,
  loginState: LoginState.LOGGED_OUT,
  userInfo: null,
  healthCheck: undefined,
  requestingLogin: false
};

export const login = createAsyncThunk<User, string, { rejectValue: string }>(
  'users/login',
  async (oidcAccessToken, thunkApi) => {
    try {
      enableAuthorization(oidcAccessToken);

      const response = await urqlClient
        .mutation(gql`
          mutation login {
            login {
              id
              userName
              email
              displayName
              locale
              defaultTemplateId
              avatarUrl
              team
              isAdmin
              featureFlags
            }
          }
        `)
        .toPromise();
      return response.error ? thunkApi.rejectWithValue(response.error.message) : response.data.login;
    } catch (error: any) {
      return thunkApi.rejectWithValue(error);
    }
  }
);

export const executeHealthCheck = createAsyncThunk<UserHealthCheck, void, { rejectValue: string }>(
  'users/executeHealthCheck',
  async (_, thunkApi) => {
    try {
      const response = await urqlClient
        .query(
          `query HealthCheck {
            currentUser {
              id
              healthCheck {
                doesGitHubEmailMatch
                hasGitHubEmail
                hasGitHubToken
                hasRequiredScopes
                isGitHubTokenValid
              }
            }
          }`,
          {},
          { requestPolicy: 'network-only' }
        )
        .toPromise();
      return response.error ? thunkApi.rejectWithValue(response.error.message) : response.data.currentUser.healthCheck;
    } catch (error: any) {
      return thunkApi.rejectWithValue(error);
    }
  }
);

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;

      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}accessToken`, state.accessToken);
    },
    setUserInfo(state, action: PayloadAction<Partial<User>>) {
      state.userInfo = { ...state.userInfo, ...action.payload };
    },
    setLoginState(state, action: PayloadAction<LoginState>) {
      state.loginState = action.payload;
      state.loggedIn = action.payload === LoginState.LOGGED_IN;
    },
    logout(state, action: PayloadAction) {
      state.userInfo = null;
      state.loginState = LoginState.LOGGED_OUT;
      state.loggedIn = false;
      state.accessToken = undefined;
      disableAuthorization();

      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}accessToken`);
    },
    requestLogin(state, action: PayloadAction<boolean>) {
      state.requestingLogin = action.payload;
    }
  },
  extraReducers: (builder) => {
    // LOGIN
    builder.addCase(login.pending, (state, action) => {
      state.loginState = LoginState.LOGGING_IN;
      state.loggedIn = false;
    });
    builder.addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
      console.log('Logged in!', action.payload);
      state.loginState = LoginState.LOGGED_IN;
      state.loggedIn = true;
      state.userInfo = action.payload;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loginState = LoginState.LOGGED_OUT;
      state.loggedIn = false;
      state.loginError = action.payload;
      state.userInfo = null;
    });
    builder.addCase(executeHealthCheck.fulfilled, (state, action: PayloadAction<UserHealthCheck>) => {
      state.healthCheck = action.payload;
    });
    builder.addCase(executeHealthCheck.rejected, (state, action) => {
      state.healthCheck = undefined;
    });
  }
});
