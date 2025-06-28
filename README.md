# Konsti

[![Build](https://github.com/con2/konsti/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/con2/konsti/actions/workflows/test.yml) [![Known Vulnerabilities](https://snyk.io/test/github/con2/konsti/badge.svg)](https://snyk.io/test/github/con2/konsti)

Event signup application Konsti. Support first-come signup and lottery signup.

Konsti is used by conventions like [Ropecon](https://ropecon.fi), [Tracon](https://tracon.fi), [Tracon Hitpoint](https://hitpoint.tracon.fi), and [Solmukohta](https://solmukohta.eu). Konsti has been in use since Ropecon 2017 and is used by thousands of users. Event data is fetched from [Kompassi Event Management System](https://kompassi.eu/).

## Features

- First-come signups
- Lottery signup using [eventassigner-js](https://github.com/Altesmi/eventassigner-js) and [eventassigner-random](https://github.com/Altesmi/eventassigner-random).
  - Users can choose weighted preferences
  - Users can form groups to be assigned into the same event

## Quick Start

- Requirements
  - Node.js 22.11.0
  - Docker
  - Yarn

- Run

  ```shell
  yarn
  yarn docker:db
  yarn run populate-db:dummy
  yarn start:dev
  ```

- Open `localhost:8000`

- Login credentials for different roles
  - **Admin**: admin:test
  - **Users**: test1:test | test2:test | test3:test
  - **Users in same group**: group1:test | group2:test | group3:test
  - **Helpers**: helper:test

You can also run the project completely in Docker:

```shell
yarn docker-compose:start
```

In this case, access the frontend at `localhost:5000`.

## Tech

- General
  - TypeScript
  - Zod
  - Prettier & ESlint
  - Vitest
  - Playwright

- Backend
  - Node.js
  - Express
  - MongoDB
  - Kubernetes

- Frontend
  - React
  - Redux & Redux Toolkit
  - Webpack
  - styled-components
  - stylelint

## Supporters

Konsti development supported by

[![Reaktor logo](/client/assets/reaktor-logo.png)](https://www.reaktor.com)&nbsp;&nbsp;&nbsp;
[![Sovellin logo](/client/assets/sovellin-logo.png)](https://www.sovellin.com)&nbsp;&nbsp;&nbsp;
[![BrowserStack logo](/client/assets/browserstack-logo.png)](https://www.browserstack.com)
[![Sentry logo](/client/assets/sentry-logo.png)](https://sentry.io)
