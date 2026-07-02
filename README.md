# Konsti

[![Build](https://github.com/con2/konsti/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/con2/konsti/actions/workflows/test.yml)

Event signup application Konsti. Supports direct signup (first-come-first-served) and lottery sign-up.

Konsti is used by conventions like [Ropecon](https://ropecon.fi), [Tracon](https://tracon.fi), [Tracon Hitpoint](https://hitpoint.tracon.fi), and [Solmukohta](https://solmukohta.eu). Konsti has been in use since Ropecon 2017 and is used by thousands of users. Event data is fetched from [Kompassi Event Management System](https://kompassi.eu/).

## Features

- Direct sign-up (first-come-first-served)
- Lottery sign-up using [eventassigner-js](https://github.com/Altesmi/eventassigner-js) and [eventassigner-random](https://github.com/Altesmi/eventassigner-random)
  - Users can choose weighted preferences
  - Users can form groups to be assigned to the same program item

## Quick Start

- Requirements
  - Node.js 24.18.0
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

### Running multiple local instances

To run several copies of the app at once (for example one per git worktree)
without port or database collisions, set `PORT_OFFSET` to a small integer before
starting. The offset shifts every port by the same amount and picks a dedicated
dev database:

| `PORT_OFFSET` | Client (Vite) | Server / API | Dev database |
| ------------- | ------------- | ------------ | ------------ |
| `0` (default) | `8000`        | `5000`       | `konsti`     |
| `1`           | `8001`        | `5001`       | `konsti-1`   |
| `2`           | `8002`        | `5002`       | `konsti-2`   |

```shell
export PORT_OFFSET=1   # set once per terminal, before the commands below
yarn start:dev
```

`export` makes the offset visible to both the server and the client processes.
To make it persistent for a worktree, add `PORT_OFFSET=1` to both
`server/.env.development` and `client/.env.development.local` (both gitignored).

All instances share the single MongoDB container on port `27017`; they stay
isolated because each `PORT_OFFSET` uses its own database name. Seed a specific
instance with `PORT_OFFSET=1 yarn run populate-db:dummy`. Then open
`localhost:8001`.

The database scripts (`populate-db:*`, `load-past-event-data`,
`update-kompassi-data`) also read `server/.env.development`, so a persistent
`PORT_OFFSET` set there targets the right database without the shell variable.
A `PORT_OFFSET` set in the shell always wins over the file.

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
  - Vite
  - styled-components
  - stylelint

## Documentation

See [docs](docs/index.md) for additional documentation, including the domain [terminology glossary](docs/terminology.md), event deployment guides, the [datafiles guide](docs/en/datafiles-guide.md) and [aggregated statistics](docs/statistics.md) derived from past-event dumps, and style guide.

## Blog posts

- 2025: [Analyysi Konstin pöytäroolipelitilastoista Ropeconeissa 2022-2024](https://blog.ropecon.fi/analyysi-konstin-poytaroolipelitilastoista-ropeconeissa-2022-2024/)
- 2023: [Analyysi Konstin pöytäroolipelitilastoista Ropeconissa 2022](https://blog.ropecon.fi/analyysi-konstin-poytaroolipelitilastoista-ropeconissa-2022/)

## Supporters

Konsti development supported by

[![Reaktor logo](/client/assets/reaktor-logo.png)](https://www.reaktor.com)&nbsp;&nbsp;&nbsp;
[![Sovellin logo](/client/assets/sovellin-logo.png)](https://www.sovellin.com)&nbsp;&nbsp;&nbsp;
[![BrowserStack logo](/client/assets/browserstack-logo.png)](https://www.browserstack.com)
[![Sentry logo](/client/assets/sentry-logo.png)](https://sentry.io)

Konsti logo created by Ami Koiranen.
