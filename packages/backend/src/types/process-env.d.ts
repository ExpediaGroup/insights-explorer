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
    IEX_VERSION: string;
    NODE_ENV: 'development' | 'production';

    // Logging
    LOG_REQUESTS: string;
    LOG_LEVEL: string;
    LOG_FORMAT: string;
    LOG_TIMESTAMPS: string;

    // Server
    PORT: string;
    ENCRYPTION_KEY: string;
    PUBLIC_URL: string;
    GRAPHQL_PLAYGROUND: string;

    // GITHUB
    GITHUB_URL: string;
    GITHUB_REST_API_URL: string;
    GITHUB_GRAPHQL_API_URL: string;
    GITHUB_SERVICE_ACCOUNT: string;
    GITHUB_ACCESS_TOKEN: string;
    GITHUB_TEMPLATE_REPOSITORY: string;
    GITHUB_DEFAULT_ORG: string;

    // MQ
    CONVERSION_SQS_URL: string;

    // Elasticsearch
    ELASTICSEARCH_NODE: string;
    ELASTICSEARCH_MAX_RETRIES: string;
    ELASTICSEARCH_REQUEST_TIMEOUT: string;
    ELASTICSEARCH_INIT_ON_STARTUP: string;

    // Possible values: [query_then_fetch, dfs_query_then_fetch]
    ELASTICSEARCH_SEARCH_TYPE: 'query_then_fetch' | 'dfs_query_then_fetch';

    // Database
    DB_HOST: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_DATABASE: string;
    DB_INIT_ON_STARTUP: string;
    DB_DEBUG: string;

    // Object Storage
    S3_BUCKET: string;
    S3_REGION: string;
    S3_CONCURRENCY_LIMIT: string;

    // Okta
    OKTA_BASE_URL: string;
    OKTA_CLIENT_ID: string;

    // External
    IEX_SCM_URL: string;
    EXTERNAL_DOC_URL: string;
    CHAT_PROVIDER: string;
    CHAT_CHANNEL: string;
    CHAT_URL: string;
  }
}
