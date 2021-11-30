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

declare namespace NodeJS {
  export interface ProcessEnv {
    VERSION: string;
    NODE_ENV: 'development' | 'production';

    // Logging
    LOG_REQUESTS: string;
    LOG_LEVEL: string;
    LOG_FORMAT: string;
    LOG_TIMESTAMPS: string;

    // API
    IEX_API_URL: string;

    // Slack
    SLACK_SIGNING_SECRET: string;
    SLACK_APP_TOKEN: string;
    SLACK_BOT_TOKEN: string;
    SLACK_DEVELOPER_MODE: 'true' | 'false';

    // Elasticsearch
    ELASTICSEARCH_NODE: string;
    ELASTICSEARCH_MAX_RETRIES: string;
    ELASTICSEARCH_REQUEST_TIMEOUT: string;
    ELASTICSEARCH_INIT_ON_STARTUP: string;
    ELASTICSEARCH_SEARCH_TYPE: 'query_then_fetch' | 'dfs_query_then_fetch';
  }
}
