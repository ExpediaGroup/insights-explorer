# Build Stage
FROM node:18.6.0-buster as build

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
FROM node:18.6.0-buster

WORKDIR /opt/iex
COPY --from=build /opt/iex .

EXPOSE 3001
CMD [ "npm", "run", "start:backend:prod" ]
