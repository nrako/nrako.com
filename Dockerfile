FROM circleci/node:dubnium-browsers
USER root
WORKDIR /usr/app
RUN chown -R circleci:circleci /usr/app
USER circleci

COPY package.json ./package-lock.json next.config.js jest.config.js jest-puppeteer.config.js .eslintrc.js ./
RUN npm install

VOLUME ./components:/user/app/components
VOLUME ./pages:/user/app/pages
VOLUME ./static:/user/app/static
VOLUME ./__tests__:/user/app/__tests__
VOLUME ./__tests__/__ci__image_snapshots__:/user/app/__tests__/__image_snapshots__
