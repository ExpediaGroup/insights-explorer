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

export interface SearchQuery {
  match?: unknown;
  multi_match?: unknown;
  bool?: unknown;
  range?: unknown;
}

// Define the type of the body for the Search request
export interface SearchBody {
  from?: number;
  size?: number;
  sort?: any[];
  query?: SearchQuery;
  search_after?: any[];
  aggregations?: any;
}

// Complete definition of the Search response
export interface ShardsResponse {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
}

export interface Explanation {
  value: number;
  description: string;
  details: Explanation[];
}

export interface SearchResponse<T> {
  took: number;
  timed_out: boolean;
  _scroll_id?: string;
  _shards: ShardsResponse;
  hits: {
    total: { value: number; relation: 'eq' | 'gte' };
    max_score: number;
    hits: Array<{
      _index: string;
      _type: string;
      _id: string;
      _score: number;
      _source: T;
      _version?: number;
      _explanation?: Explanation;
      fields?: unknown;
      highlight?: unknown;
      inner_hits?: unknown;
      matched_queries?: string[];
      sort?: string[];
    }>;
  };
  aggregations?: any;
}

export interface GetResponse<T> {
  _index: string;
  _type: string;
  _id: string;
  _source: T;
  _version?: number;
  _seq_no: number;
  _primary_term: number;
  found: boolean;
}

export interface MgetResponse<T> {
  docs: {
    _index: string;
    _type: string;
    _id: string;
    _source: T;
    _version?: number;
    _seq_no: number;
    _primary_term: number;
    found: boolean;
  }[];
}

export interface CountResponse {
  count: number;
  _shards: ShardsResponse;
}
