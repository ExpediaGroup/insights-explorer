# Build Stage
FROM node:22.9.0-bookworm as build

RUN git config --global url."https://".insteadOf ssh://

WORKDIR /opt/iex
COPY . /opt/iex

RUN npm set progress=false && npm set loglevel warn
RUN npm ci

RUN npm run build && \
  npm run test && \
  npm run prune:production && \
  npm prune --production
RUN find . -name ".npmrc" -type f -delete

# Production Stage
FROM node:22.9.0-alpine

WORKDIR /opt/iex
COPY --from=build /opt/iex .

EXPOSE 3001
CMD [ "npm", "run", "start:backend:prod" ]
