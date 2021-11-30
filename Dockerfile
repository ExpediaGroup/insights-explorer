# Build Stage
FROM node:14.18.1-buster as build

RUN git config --global url."https://".insteadOf ssh://
RUN npm set progress=false && npm set loglevel warn

WORKDIR /opt/iex
COPY . /opt/iex

RUN npm ci && \
  npm run bootstrap

RUN npm run build && \
  npm run test && \
  npm run prune:production && \
  npm prune --production
RUN find . -name ".npmrc" -type f -delete

# Production Stage
FROM node:14.18.1-alpine

WORKDIR /opt/iex
COPY --from=build /opt/iex .

EXPOSE 3001
CMD [ "npm", "run", "start:backend:prod" ]
