FROM node:12-alpine

ENV PROJECT_ROOTDIR="/app/" NODE_ENV="production" NPM_CONFIG_PRODUCTION=false YARN_PRODUCTION=false

WORKDIR /app/

COPY . /app/

RUN yarn --frozen-lockfile --production=false

EXPOSE 3000
