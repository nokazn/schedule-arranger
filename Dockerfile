FROM node:12-alpine

ENV PROJECT_ROOTDIR="/app/" NODE_ENV="production" NPM_CONFIG_PRODUCTION=false YARN_PRODUCTION=false

WORKDIR ${PROJECT_ROOTDIR}

COPY package.json yarn.lock ${PROJECT_ROOTDIR}

RUN apk add python make g++ && yarn

COPY . ${PROJECT_ROOTDIR}

EXPOSE 3000
