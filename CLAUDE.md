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
- **scripts/** — root Node scripts for the combined coverage pipeline (see Combined Code Coverage below). Run with plain `node`, so they must avoid TypeScript syntax that needs transformation (enums, path aliases).

**Workspace-specific guidance lives in each directory's own `CLAUDE.md`** (loaded automatically when you work in that directory). Keep workspace-level detail there and this file to cross-cutting concerns.

Yarn 4 workspaces — only `client` and `server` are Yarn workspaces; `shared` and `playwright` are plain TypeScript directories consumed via the `shared/*` path alias and run via root scripts. Node >= 24.18.0. Use yarn, not npm. All code and scripts must be OS agnostic (Linux, Mac, Windows). Use exact dependency versions (e.g., `"vite": "7.3.1"`, not `"~7.3.1"` or `"^7.3.1"`). Client must support browsers released within the last 5 years.

## Code Style

- Don't end single line code comments with a period: write `// This is a comment`, not `// This is a comment.`
- Keep code comments succinct: state the non-obvious constraint or reason in a sentence or two rather than narrating the full mechanism behind it.
- Comments document how the code works now — don't describe how it used to work or what changed (that's what git history is for).
- Don't reference other files or components by name in code comments — renames and restructuring make them stale. Describe the role instead: "exported so callers can check...", not "exported so ProgramItemEntry can check...".
- Never use the em dash character (—) in code, UI text, comments, or docs. Use a regular hyphen (-) or restructure the sentence.

## Terminology

- Don't use "FCFS" as shorthand for "first-come-first-served" — write it out in full.

## Git Commits

- Don't add a `Co-Authored-By: Claude ...` trailer (or any AI co-author line) to commit messages — keep the message plain, ending at the body.
- Don't reference CLAUDE.md (or its guidance) in commit messages — describe the change itself, not the doc it follows.

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

# Code coverage (combined vitest + Playwright report for the whole project)
yarn coverage               # Full pipeline → coverage/report/index.html
yarn coverage:vitest        # Unit test coverage only (all workspaces in one run)
yarn coverage:e2e           # Playwright coverage only (extra args go to `playwright test`)
yarn coverage:report        # Merge whatever coverage data exists into the report

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

### Combined Code Coverage

`yarn coverage` builds one istanbul report for the whole project (client + server + shared) from both the vitest unit tests and the Playwright E2E suite → `coverage/report/index.html` (+ `lcov.info`). The three stages also run standalone and tolerate missing inputs:

- `yarn coverage:vitest` — root vitest run; the coverage config lives in the root `vitest.config.ts` and is the only one (in projects mode vitest ignores project-level coverage settings). It enumerates every source file matching the include globs — tested or not — which makes it the **canonical structure** for the merge, and writes the json even when tests fail (`reportOnFailure`).
- `yarn coverage:e2e` — `scripts/runE2eCoverage.ts` starts the server with `NODE_V8_COVERAGE` (flushed via the dev-only `POST /api/write-coverage` endpoint before shutdown, then remapped onto the TS sources with `c8`) and the client dev server with `COVERAGE=true` (istanbul-instrumented; `client/coverageCollectorPlugin.ts` harvests `window.__coverage__` via an injected flush script and a `/__coverage__` middleware, so specs stay on plain `@playwright/test`). Extra args are forwarded to `playwright test` for subset runs, e.g. `yarn coverage:e2e programSearch "--project=Chrome Stable"`. Resolves the per-worktree port offset once (`scripts/portOffset.ts`) and pins it into the server, client, and Playwright processes; an explicit `PORT_OFFSET` wins.
- `yarn coverage:report` — `scripts/mergeCoverageReport.ts` merges the inputs. The E2E data cannot be merged into the vitest data key-by-key (different instrumentation pipelines produce different statement maps), so E2E hits are **projected** onto the canonical vitest maps: statements by exact start position with a first-statement-on-the-line fallback for the line-based V8 server data; functions by exact position, else counted covered when any line inside the body has hits (the V8 data's own function entries are transform-helper noise); branches on exact matches only, so branch coverage mostly reflects unit tests. Top-level module-scope statements are additionally credited whenever the E2E data shows the module executed at all — evaluating a module runs every top-level statement, but the browser data's source-map remap collapses many of them (e.g. styled-components declarations), so they can never match by position.

The coverage include/exclude globs live in one place — `scripts/coverageGlobs.ts` — consumed by the root `vitest.config.ts`, the `c8 report` flags in `scripts/runE2eCoverage.ts`, and the istanbul plugin config in `client/vite.config.ts` (which runs with the repo root as its glob cwd, so shared/ modules served to the browser are instrumented too).

CI: `.github/workflows/coverage.yml` runs the pipeline on pushes to main only — it re-runs the whole test suite against instrumented builds, so a pull_request trigger would double every PR's CI cost on top of test.yml (which tests the production build). The Playwright half is sharded like the `e2e` job in test.yml (`yarn coverage:e2e --shard=n/total`); each shard uploads its coverage slice as an artifact and the `coverage-report` job merges them with the vitest coverage — the merge script accepts any number of JSON files per input directory, so shard slices and local single runs use the same code path. Every run writes the totals table (`coverage/report/summary.md`) to the job summary and uploads the HTML report as the `coverage-report` artifact; fully green main runs additionally publish it to GitHub Pages at <https://con2.github.io/konsti/>.

## Test Data Credentials

- Admin: `admin:test`
- Regular users: `test1:test`, `test2:test`, `test3:test`
- Group users: `group1:test`, `group2:test`, `group3:test`
- Helper: `helper:test`
