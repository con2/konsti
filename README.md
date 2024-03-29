# Konsti

[![Build](https://github.com/con2/konsti/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/con2/konsti/actions/workflows/test.yml)

[![Known Vulnerabilities](https://snyk.io/test/github/con2/konsti/badge.svg)](https://snyk.io/test/github/con2/konsti)

Event signup application Konsti. The application is used to sign up and assign users to events. Registered users can choose weighted preferences for different time slots and event seats are quickly allocated using [Hungarian algorithm](https://en.wikipedia.org/wiki/Hungarian_algorithm), [eventassigner-js](https://github.com/Altesmi/eventassigner-js), or [brute force approximation](https://github.com/Altesmi/eventassigner-random). Users can form groups to be assigned into the same event.

Konsti is used by roleplaying conventions [Ropecon](https://ropecon.fi) and [Tracon Hitpoint](https://hitpoint.tracon.fi). Event data is fetched from [Kompassi Event Management System](https://kompassi.eu/).

Registered users by year:

- Ropecon 2017: 550 (live, Hungarian algorithm)
- Ropecon 2018: 850 (live, brute force approximation)
- Ropecon 2019: 920 (live, eventassigner-js + brute force approximation)
- Tracon Hitpoint 2019: 150 (live, eventassigner-js + brute force approximation)
- Ropecon 2021: 150 (remote, direct signup)
- Ropecon 2022: 1080 (live, assignment + direct signup)

## Quick Start

- Requirements

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
  - Prettier & ESlint
  - Jest
  - Playwright

- Back-end

  - Node.js
  - Express
  - MongoDB
  - AWS

- Front-end

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
