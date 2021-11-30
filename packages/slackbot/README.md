# Insights Explorer Slack Bot

Slack app providing chat features for Insight Explorer.

## Installation

```
npm install
```

## Configuration

[dotenv-flow](https://github.com/kerimdzhanov/dotenv-flow)

## Docker Build

The Docker image must be built from the monorepo root:

```sh
docker build -t slackbot -f packages/slackbot/Dockerfile .
```
