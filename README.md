# konsti-client

![Build](https://github.com/Archinowsk/konsti-client/workflows/Node%20CI/badge.svg)

[![Known Vulnerabilities](https://snyk.io/test/github/archinowsk/konsti-client/badge.svg)](https://snyk.io/test/github/archinowsk/konsti-client)

Tabletop roleplaying game signup application Konsti. The application is used to sign up and assign players to game sessions. Registered users can choose weighted preferences and signup slots are quickly allocated using [Hungarian algorithm](https://en.wikipedia.org/wiki/Hungarian_algorithm), [eventassigner-js](https://github.com/Altesmi/eventassigner-js), or brute force approximation. Users can form groups to be assigned into the same game session. Game data is fetched from [Kompassi Event Management System](https://kompassi.eu/).

Konsti is designed for the roleplaying convention [Ropecon](https://ropecon.fi).

Registered users by year:

- Ropecon 2017: 550
- Ropecon 2018: 850
- Ropecon 2019: 920

## Tech

- Back-end (see [konsti-server](https://github.com/Archinowsk/konsti-server))
  - Node.js
  - Express
  - AWS
  - MongoDB
  - TypeScript
  - Jest
  - Prettier & ESLint
- Front-end
  - React
  - Redux
  - Webpack
  - TypeScript
  - Jest
  - Prettier & ESLint & stylelint

## Supporters

Konsti development supported by <a href="https://www.sovellin.com/">Sovellin</a>

<a href="https://www.sovellin.com/"><img src="https://github.com/Archinowsk/archinowsk.github.io/blob/master/assets/sovellin-logo.svg" height="40"></a>

Mobile testing supported by <a href="https://www.browserstack.com/">BrowserStack</a>

<a href="https://www.browserstack.com/"><img src="https://github.com/Archinowsk/archinowsk.github.io/blob/master/assets/browserstack-logo.svg" height="40"></a>
