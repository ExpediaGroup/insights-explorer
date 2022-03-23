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

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';

import { AppSettings } from '../models/generated/graphql';
import { urqlClient } from '../urql';

import { login } from './user.slice';

export interface ErrorMessage {
  id: string;
  title: string;
  description: string;
}
export interface AppState {
  appSettings: AppSettings | null;
  globalErrorMessages: ErrorMessage[];
  isNewsUnread: boolean;
  latestNewsRead: string;
}

const initialState: AppState = {
  appSettings: null,
  globalErrorMessages: [],
  isNewsUnread: false,
  latestNewsRead: '2020-01-01T00:00:00.000Z'
};

export const initSettings = createAsyncThunk<AppSettings, void, { rejectValue: string }>(
  'app/initSettings',
  async (_, thunkApi) => {
    try {
      const response = await urqlClient
        .query(
          `query AppSettings {
            appSettings {
              version
              authSettings {
                provider
                authorizeUrl
                clientId
                scopes
                issuer
                pkceEnabled
              }
              gitHubSettings {
                url
                defaultOrg
              }
              externalBlogUrl
              externalDocUrl
              externalVideosUrl
              iexScmUrl
              chatSettings {
                provider
                url
                channel
              }
            }
          }`
        )
        .toPromise();
      return response.error ? thunkApi.rejectWithValue(response.error.message) : response.data.appSettings;
    } catch (error: any) {
      return thunkApi.rejectWithValue(error);
    }
  }
);

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    mostRecentNews(state, action: PayloadAction<string>) {
      // Compare date of most recent news with the latest news read date
      state.isNewsUnread = action.payload > state.latestNewsRead;
    },
    readNews(state, action: PayloadAction<void>) {
      state.latestNewsRead = DateTime.utc().toString();
      state.isNewsUnread = false;
    },
    pushGlobalErrorMessage(state, action: PayloadAction<ErrorMessage>) {
      state.globalErrorMessages.push(action.payload);
    },
    removeGlobalErrorMessage(state, action: PayloadAction<string>) {
      state.globalErrorMessages = state.globalErrorMessages.filter((message) => message.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    // LOGIN
    builder.addCase(login.rejected, (state, action) => {
      if (action.payload) {
        state.globalErrorMessages.push({
          title: 'Login Failed',
          description: action.payload,
          id: action.meta.requestId
        });
      }
    });
    // INITSETTINGS
    builder.addCase(initSettings.fulfilled, (state, action: PayloadAction<AppSettings>) => {
      console.log('Initialized!', action.payload);
      state.appSettings = action.payload;
    });
    builder.addCase(initSettings.rejected, (state, action) => {
      state.appSettings = null;
      state.globalErrorMessages.push({
        title: 'App Initialization Failed',
        description: action.payload || 'An error occurred',
        id: action.meta.requestId
      });
    });
  }
});
