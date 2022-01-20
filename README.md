# ![](/assets/logo/iex-logo-and-name.svg)

[![Release](https://github.com/ExpediaGroup/insights-explorer/actions/workflows/release.yaml/badge.svg)](https://github.com/ExpediaGroup/insights-explorer/actions/workflows/release.yaml)
![GitHub license](https://img.shields.io/github/license/ExpediaGroup/insights-explorer)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

Insights Explorer is a website designed to make it easy to document, edit, and view analytical insights.  Insights are Markdown-based repositories stored in GitHub, but viewed and edited through our interface.  IEX has support for full-text searching, advanced Markdown syntax, and document viewing (e.g. `pptx`, `docx`, `pdf`, etc.).

# Features

* Create and edit Markdown-based documents
* File upload & viewing for common file types
* Discover Insights with full-text search
* Like and comment to contribute to the discussion

# Installation

Insights Explorer requires the following dependencies:

* [Elasticsearch](https://www.elastic.co/elasticsearch/)  7.x
* [PostgreSQL](https://www.postgresql.org/) 10+
* AWS S3 bucket (or compatible API)
* AWS SQS queues
* [Okta](https://www.okta.com/) application for authentication
* GitHub.com or GitHub Enterprise account & organization

## Local Development

For contributing features and fixes, IEX can be built and run locally.

### Building the Project

This repository is a monorepo using [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces) to manage the contained packages.

🚨 The Node.js version is managed by [nvm](https://github.com/nvm-sh/nvm). Install with `brew install nvm` or follow the installation instructions.

```sh
nvm use
npm install
npm run build
```

### Running a Development Server

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

## Self-Hosted Production

### Docker

Pre-built Docker images are available in the GitHub container registery:

```sh
docker pull ghcr.io/expediagroup/insights-explorer:1
```

Create a new `.env` file containing all the required configuration, then run the image:

```sh
docker run -p 3001:3001 --env-file=.env ghcr.io/expediagroup/insights-explorer:1
```

### Manually Building Docker Images

Building the Docker images manually only requires Docker to be installed.

You can build and run the main Docker image:

```sh
docker build -t insights-explorer:latest .
docker run -p 3001:3001 insights-explorer:latest
```

Convertbot:

```sh
docker build -t iex/convertbot:latest -f packages/convertbot/Dockerfile .
```

Slackbot:

```sh
docker build -t iex/slackbot:latest -f packages/slackbot/Dockerfile .
```

# Third-Party Licenses

Third-party licenses are compiled for dependencies this project uses.  You can view the licenses directly in the [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) file.

To update the list of third-party licenses, run the following command:

```
npm run license:thirdparty
```

# Legal

This project is available under the Apache 2.0 License.

Copyright 2020-2022 Expedia, Inc.
