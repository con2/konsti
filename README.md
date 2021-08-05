# Konsti

![Build](https://github.com/ropekonsti/konsti/workflows/Node%20CI/badge.svg)

[![Known Vulnerabilities](https://snyk.io/test/github/ropekonsti/konsti/badge.svg)](https://snyk.io/test/github/ropekonsti/konsti)

Tabletop roleplaying game signup application Konsti. The application is used to sign up and assign players to game sessions. Registered users can choose weighted preferences and signup slots are quickly allocated using [Hungarian algorithm](https://en.wikipedia.org/wiki/Hungarian_algorithm), [eventassigner-js](https://github.com/Altesmi/eventassigner-js), or [brute force approximation](https://github.com/Altesmi/eventassigner-random). Users can form groups to be assigned into the same game session. Game data is fetched from [Kompassi Event Management System](https://kompassi.eu/).

Konsti is designed for the roleplaying convention [Ropecon](https://ropecon.fi).

Registered users by year:

- Ropecon 2017: 550
- Ropecon 2018: 850
- Ropecon 2019: 920

## Quick Start

- Requirements

  - Docker

- Run

  ```
  yarn docker:start
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
  - Redux
  - Webpack
  - stylelint

## Cypress end-to-end tests

See [Cypress Dashboard](https://dashboard.cypress.io/projects/btftv2) for test results.

## Supporters

Konsti development supported by

<a href="https://www.reaktor.com/"><img src="https://github.com/Archinowsk/archinowsk.github.io/blob/master/assets/reaktor-logo.svg" height="40"></a>

<a href="https://www.sovellin.com/"><img src="https://github.com/Archinowsk/archinowsk.github.io/blob/master/assets/sovellin-logo.svg" height="40"></a>

Mobile testing supported by <a href="https://www.browserstack.com/">BrowserStack</a>

<a href="https://www.browserstack.com/"><img src="https://github.com/Archinowsk/archinowsk.github.io/blob/master/assets/browserstack-logo.svg" height="40"></a>
