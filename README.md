# ![](/assets/logo/iex-logo-and-name.svg)

[![Release](https://github.com/ExpediaGroup/insights-explorer/actions/workflows/release.yaml/badge.svg)](https://github.com/ExpediaGroup/insights-explorer/actions/workflows/release.yaml)
![GitHub license](https://img.shields.io/github/license/ExpediaGroup/insights-explorer)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

Insights Explorer is a website and service that makes it easy to document, edit, and view analytical insights.

# Features

* Create and edit Markdown-based documents
* File upload & viewing for common file types
* Discover Insights with full-text search
* Like and comment to contribute to the discussion

# Getting started

## Prerequisites

A fully-functioning deployment requires the following:

* Elasticsearch 7.x
* PostgreSQL database
* S3 bucket
* SQS Queues
* Okta application
* GitHub.com or GitHub Enterprise

### Building the Project

This repository is a monorepo with multiple projects inside it. [Lerna](https://lerna.js.org/) is currently used to manage the monorepo.

🚨 The Node.js version is managed by [nvm](https://github.com/nvm-sh/nvm). Install with `brew install nvm` or follow the installation instructions.

```sh
nvm use
npm install && npm run bootstrap
npm run build
```

### Running Locally

Running IEX locally is convenient for development.

Environment variables need to be provided by creating an `.env.development.local` file under `packages/backend/env`.  The `.env` file can be used as a template:

```sh
cp packages/backend/env/.env packages/backend/env/.env.development.local
```

Please note that any `.env.*.local` files will be ignored by git, so it is safe to embed secrets in those files for local use only.

Start the frontend/backend servers:

```sh
npm start
```

The `backend` service starts on port 3000, and `frontend` launches on port 3001.  Please note that this is only to facilitate development&mdash; in production the backend service serves the compiled frontend files.

### Docker

This project also provides a Dockerfile. Building a Docker image only requires Docker to be installed.

You can build and run the main Docker image:

```sh
docker build -t insights-explorer:latest .
docker run -p 3001:3001 insights-explorer:latest
```

Convertbot:

```sh
ln -s -f packages/convertbot/.dockerignore ./.dockerignore
docker build -t iex/convertbot:latest -f packages/convertbot/Dockerfile .
```

Slackbot:

```sh
ln -s -f packages/slackbot/.dockerignore ./.dockerignore
docker build -t iex/slackbot:latest -f packages/slackbot/Dockerfile .
```

### Third-Party Licenses

Third-party licenses are compiled for dependencies this project uses.  You can view the licenses directly in the [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) file.

To update the list of third-party licenses, run the following command:

```
npm run license:thirdparty
```

## Legal

This project is available under the Apache 2.0 License.

Copyright 2020-2021 Expedia, Inc.
