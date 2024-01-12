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
import { createSlice } from '@reduxjs/toolkit';

import type { Insight, Paging, Sort } from '../models/generated/graphql';

export interface SearchOptions {
  layout?: 'default' | 'compact' | 'square';
  showScores?: boolean;
  showUpdatedAt?: boolean;
  dispatchSearch?: boolean;
}

export interface SearchState {
  query: string;
  useNewSearch: boolean;
  sort?: Sort;
  paging?: Paging;

  // If true, indicates there are filters applied
  isFiltered: boolean;

  // If true, the filter UI will be shown
  showFilters: boolean;

  options: SearchOptions;
  results: Array<Pick<Insight, 'id' | 'name' | 'fullName' | 'itemType'>>;
}

const initialState: SearchState = {
  query: '',
  useNewSearch: true,
  sort: undefined,
  paging: undefined,
  isFiltered: false,
  showFilters: false,
  options: {
    layout: 'default',
    showScores: false,
    showUpdatedAt: true
  },
  results: []
};

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    setUseNewSearch(state, action: PayloadAction<boolean>) {
      state.useNewSearch = action.payload;
    },
    setSort(state, action: PayloadAction<Sort | undefined>) {
      state.sort = action.payload;
    },
    setSortField(state, action: PayloadAction<string>) {
      if (state.sort === undefined) {
        state.sort = {};
      }

      state.sort.field = action.payload;

      // Apply a specific direction for certain fields
      switch (action.payload) {
        case 'name': {
          state.sort.direction = 'asc';
          break;
        }
        case 'relevance':
        case 'createdAt':
        case 'updatedAt':
        case 'publishedDate':
        case 'commentCount':
        case 'likeCount':
        case 'viewCount': {
          state.sort.direction = 'desc';
          break;
        }
      }
    },
    setSortDirection(state, action: PayloadAction<'asc' | 'desc'>) {
      if (state.sort === undefined) {
        state.sort = {};
      }

      state.sort.direction = action.payload;
    },
    setSearchResults(state, action: PayloadAction<any>) {
      const searchResults = action.payload;
      if (searchResults !== undefined && searchResults.length > 0) {
        state.results = searchResults;
      }
    },
    parseUrlIntoState(
      state,
      action: PayloadAction<{
        query: string | undefined;
        searchParams: { sort?: string; dir?: string; legacySearch?: boolean };
      }>
    ) {
      const { query, searchParams } = action.payload;
      // Take URL only if not empty
      // Otherwise it might clear the persisted state
      if (query !== undefined) {
        state.query = query;
      }

      let modified = false;
      if (searchParams.sort) {
        state.sort = { field: searchParams.sort };
        modified = true;
      }
      if (searchParams.dir) {
        if (state.sort == null) {
          state.sort = {};
        }
        state.sort.direction = searchParams.dir as 'asc' | 'desc';
        modified = true;
      }

      if (searchParams.legacySearch) {
        state.useNewSearch = false;
        modified = true;
      }

      // If query provided but sort not modified, clear the existing sort options
      if (query && !modified) {
        state.sort = undefined;
      }
    },
    setIsFiltered(state, action: PayloadAction<boolean>) {
      state.isFiltered = action.payload;
    },
    setShowFilters(state, action: PayloadAction<boolean>) {
      state.showFilters = action.payload;
    },
    clearSearch(state, action: PayloadAction) {
      state.query = '';
      state.sort = undefined;
      state.showFilters = false;
    },
    mergeOptions(state, action: PayloadAction<SearchOptions>) {
      state.options = { ...state.options, ...action.payload };
    }
  }
});
