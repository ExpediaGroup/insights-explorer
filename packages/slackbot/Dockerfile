# Build Stage
FROM node:18.5.0-buster as build

WORKDIR /opt/iex
COPY . /opt/iex

RUN npm set progress=false && npm set loglevel warn
RUN npm ci

RUN npm run build --prefix packages/slackbot && \
  npm run test --prefix packages/slackbot && \
  npm run prune:production && \
  npm prune --production

RUN find . -name ".npmrc" -type f -delete

# Production Stage
FROM node:18.5.0-buster

WORKDIR /opt/iex
COPY --from=build /opt/iex .

EXPOSE 3020
CMD [ "npm", "run", "start:slackbot:prod" ]
