# Konsti

![Build](https://github.com/ropekonsti/konsti/workflows/Node%20CI/badge.svg)

[![Known Vulnerabilities](https://snyk.io/test/github/ropekonsti/konsti/badge.svg)](https://snyk.io/test/github/ropekonsti/konsti)

Event signup application Konsti. The application is used to sign up and assign users to events. Registered users can choose weighted preferences for different time slots and event seats are quickly allocated using [Hungarian algorithm](https://en.wikipedia.org/wiki/Hungarian_algorithm), [eventassigner-js](https://github.com/Altesmi/eventassigner-js), or [brute force approximation](https://github.com/Altesmi/eventassigner-random). Users can form groups to be assigned into the same event.

Konsti is used by roleplaying conventions [Ropecon](https://ropecon.fi) and [Tracon Hitpoint](https://hitpoint.tracon.fi). Event data is fetched from [Kompassi Event Management System](https://kompassi.eu/).

Registered users by year:

- Ropecon 2017: 550 (live, Hungarian algorithm)
- Ropecon 2018: 850 (live, brute force approximation)
- Ropecon 2019: 920 (live, eventassigner-js + brute force approximation)
- Tracon Hitpoint 2019: 150 (live, eventassigner-js + brute force approximation)
- Ropecon 2021: 150 (remote, direct signup)

## Quick Start

- Requirements

  - Docker
  - Yarn

- Run

  ```
  yarn docker-compose:start
  ```

- Open `localhost:5000`

- Login credentials for different roles

  - **Admin**: admin:test
  - **Users**: test1:test | test2:test | test3:test
  - **Helpers**: ropetiski:test

## Tech

- General

  - TypeScript
  - Prettier & ESlint
  - Jest
  - Cypress

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

## Cypress end-to-end tests

See [Cypress Dashboard](https://dashboard.cypress.io/projects/btftv2) for test results.

## Supporters

Konsti development supported by

<a href="https://www.reaktor.com/"><img src="/client/assets/reaktor-logo.png"></a> &nbsp;&nbsp;&nbsp; <a href="https://www.sovellin.com/"><img src="/client/assets/sovellin-logo.png"></a>

Mobile testing supported by <a href="https://www.browserstack.com/">BrowserStack</a>

<a href="https://www.browserstack.com/"><img src="/client/assets/browserstack-logo.png" height="40"></a>
