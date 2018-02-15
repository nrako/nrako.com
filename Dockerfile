FROM circleci/node:8.9.4-browsers
USER root
WORKDIR /usr/app
RUN chown -R circleci:circleci /usr/app
USER circleci

COPY package.json .
RUN npm install

COPY . .
