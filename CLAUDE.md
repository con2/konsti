# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Konsti is an event signup tool for conventions (Ropecon, Tracon, etc.). Users browse program items and sign up via lottery or direct signup (first-come-first-served). Supports group signups, Kompassi OAuth integration, and admin assignment management.

See [docs/terminology.md](docs/terminology.md) for the glossary of domain terms.

## Monorepo Structure

- **client/** — React 19 frontend (Vite, Redux Toolkit, styled-components, i18next for fi/en). See [client/CLAUDE.md](client/CLAUDE.md).
- **server/** — Express 5 backend (MongoDB/Mongoose, JWT auth, lottery assignment algorithms). See [server/CLAUDE.md](server/CLAUDE.md).
- **shared/** — Types, constants, configs, and utilities imported by client and server (not a Yarn workspace, used as a TypeScript path). See [shared/CLAUDE.md](shared/CLAUDE.md).
- **playwright/** — E2E tests. See [playwright/CLAUDE.md](playwright/CLAUDE.md).

**Workspace-specific guidance lives in each directory's own `CLAUDE.md`** (loaded automatically when you work in that directory). Keep workspace-level detail there and this file to cross-cutting concerns.

Yarn 4 workspaces — only `client` and `server` are Yarn workspaces; `shared` and `playwright` are plain TypeScript directories consumed via the `shared/*` path alias and run via root scripts. Node >= 24.18.0. Use yarn, not npm. All code and scripts must be OS agnostic (Linux, Mac, Windows). Use exact dependency versions (e.g., `"vite": "7.3.1"`, not `"~7.3.1"` or `"^7.3.1"`). Client must support browsers released within the last 5 years.

## Code Style

- Don't end single line code comments with a period: write `// This is a comment`, not `// This is a comment.`
- Keep code comments succinct: state the non-obvious constraint or reason in a sentence or two rather than narrating the full mechanism behind it.
- Comments document how the code works now — don't describe how it used to work or what changed (that's what git history is for).

## Terminology

- Don't use "FCFS" as shorthand for "first-come-first-served" — write it out in full.

## Git Commits

- Don't add a `Co-Authored-By: Claude ...` trailer (or any AI co-author line) to commit messages — keep the message plain, ending at the body.

## Common Commands

```bash
# Install
yarn install

# Development (requires Docker for MongoDB)
yarn start:dev              # Starts server + client with hot reload

# Seed database
yarn workspace server docker:db  # Start MongoDB container (port 27017, done automatically by start:dev)
yarn populate-db:dummy      # Load test data (admin:test, test1:test, helper:test, etc.)

# Testing
yarn test                   # Vitest unit tests (all workspaces)
yarn test:watch             # Watch mode
yarn vitest run path/to/file.test.ts  # Run a single test file

# Linting & formatting
yarn lint                   # ESLint + stylelint + Prettier + knip + unused-translation-keys
yarn eslint                 # ESLint only
yarn type-check             # TypeScript type checking
yarn prettier:write         # Auto-format

# Building
yarn build-front:prod       # Build client → client/build → copied to server/front

# E2E
yarn playwright             # Start DB + server + client + Playwright UI
yarn docker-compose:test    # Full Docker-based E2E run
```

## Cross-Cutting Concerns

### Client-Server Communication

REST API over `fetch` (the client uses a hand-rolled wrapper, not axios). All endpoints are prefixed with `/api` (auth routes under `/auth`). Endpoint constants (`ApiEndpoint`, `ApiDevEndpoint`, `AuthEndpoint`) are defined in `shared/constants/apiEndpoints.ts`; request/response schemas live in `shared/types/api/...` (dev/test variants in `shared/test-types/api/...`). Dev client runs on port 8000, production server on port 5000 — in a git worktree both shift by an automatically assigned per-worktree `PORT_OFFSET` (`scripts/portOffset.ts`; see "Running multiple local instances" in the README). Client-side detail is in [client/CLAUDE.md](client/CLAUDE.md); server routes/middleware in [server/CLAUDE.md](server/CLAUDE.md).

### Database Lifecycle (no migrations)

Each convention runs its own MongoDB instance for the duration of the event only; afterwards the DB is dumped and the instance is torn down. There is no long-lived production DB and no cross-event continuity, so **schema/enum changes don't need migrations** — change the code and let the next event start with a fresh DB. **Do not add migration scripts, startup migration hooks, or backwards-compatibility shims.** DB mechanics and the past-event datafiles are documented in [server/CLAUDE.md](server/CLAUDE.md).

**Browser storage follows the same no-migrations model via event-prefixed keys.** Browsers keep localStorage across deploys and events on the same domain, so every Konsti storage key carries the `konsti-<eventName>-<eventYear>` prefix from `shared/constants/browserStorage.ts`, and `resetStaleEventStorage()` removes previous events' keys on page load. Old events' data is never read, so storage shape changes between events need no migration or compat handling — but don't change persisted shapes mid-event: a strict parse failure clears the session and logs users out. See "Local/session storage" in [client/CLAUDE.md](client/CLAUDE.md).

### Rate Limiting

There is **no application-level rate limiting**, by design — see [server/CLAUDE.md](server/CLAUDE.md) for the rationale (shared-NAT venue WiFi; avoiding login lockout abuse).

## Test Data Credentials

- Admin: `admin:test`
- Regular users: `test1:test`, `test2:test`, `test3:test`
- Group users: `group1:test`, `group2:test`, `group3:test`
- Helper: `helper:test`
