# Build Stage
FROM node:22.9.0-bookworm as build

WORKDIR /opt/iex
COPY . /opt/iex

RUN npm set progress=false && npm set loglevel warn
RUN npm ci

RUN npm run build --workspace=@iex/slackbot && \
  npm run test --workspace=@iex/slackbot && \
  npm run prune:production && \
  npm prune --production

RUN find . -name ".npmrc" -type f -delete

# Production Stage
FROM node:22.9.0-alpine

WORKDIR /opt/iex
COPY --from=build /opt/iex .

EXPOSE 3020
CMD [ "npm", "run", "start:slackbot:prod" ]
