# Konsti

[![Build](https://github.com/con2/konsti/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/con2/konsti/actions/workflows/test.yml)

[Test coverage report](https://con2.github.io/konsti/) — combined unit test and E2E coverage from the latest green main build.

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

Several copies of the app (for example one per git worktree) can run side by
side without port or database collisions. Each checkout gets a `PORT_OFFSET`
automatically: the main checkout uses offset `0` (the classic ports below) and
every linked worktree claims the smallest free slot from a registry shared by
all worktrees (`.git/konsti-port-offsets.json` in the main checkout, resolved
by `scripts/portOffset.ts`). Removing a worktree releases its slot. The offset shifts
every port by the same amount and picks a dedicated dev database:

| `PORT_OFFSET` | Client (Vite) | Server / API | Dev database |
| ------------- | ------------- | ------------ | ------------ |
| `0` (default) | `8000`        | `5000`       | `konsti`     |
| `1`           | `8001`        | `5001`       | `konsti-1`   |
| `2`           | `8002`        | `5002`       | `konsti-2`   |

```shell
yarn start:dev   # in a worktree this resolves to e.g. offset 1 → localhost:8001
```

The automatic offset applies consistently to the dev server and client
(`start:dev`, `server`, `server:test`, `client`), the Playwright suite, and the
dev database scripts (`populate-db:*`, `load-past-event-data`,
`update-kompassi-data`), so everything started from the same worktree targets
the same instance. The client dev server uses `strictPort`, so a port collision
(for example an orphaned process squatting the port) fails loudly instead of
silently drifting to the next free port.

An explicitly set `PORT_OFFSET` always wins over the automatic assignment:

```shell
export PORT_OFFSET=5   # set once per terminal, before the commands below
yarn start:dev
```

To pin a checkout persistently, add `PORT_OFFSET=5` to both
`server/.env.development` and `client/.env.development.local` (both
gitignored); a shell-set variable still wins over the files.

All instances share the single MongoDB container on port `27017`; they stay
isolated because each `PORT_OFFSET` uses its own database name. Seed an
instance by running `yarn populate-db:dummy` from its worktree.

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
