# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Konsti is an event signup tool for conventions (Ropecon, Tracon, etc.). Users browse program items and sign up via lottery or first-come-first-served. Supports group signups, Kompassi OAuth integration, and admin assignment management.

## Monorepo Structure

- **client/** — React 19 frontend (Vite, Redux Toolkit, styled-components, i18next for fi/en)
- **server/** — Express 5 backend (MongoDB/Mongoose, JWT auth, lottery assignment algorithms)
- **shared/** — Types, constants, configs, and utilities imported by client and server (not a Yarn workspace, used as a TypeScript path)
- **playwright/** — E2E tests
- **eslint-rules/** — Custom ESLint rules

Yarn 4 workspaces. Node >= 24.14.1. Use yarn, not npm. All code and scripts must be OS agnostic (Linux, Mac, Windows). Use exact dependency versions (e.g., `"vite": "7.3.1"`, not `"~7.3.1"` or `"^7.3.1"`). Client must support browsers released within the last 5 years.

## Code Style

- Don't end code comments with a period: write `// This is a comment`, not `// This is a comment.`

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
yarn lint                   # ESLint + stylelint + Prettier check
yarn eslint                 # ESLint only
yarn type-check             # TypeScript type checking
yarn prettier:write         # Auto-format

# Building
yarn build-front:prod       # Build client → client/build → copied to server/front

# E2E
yarn playwright             # Start DB + server + client + Playwright UI
yarn docker-compose:test    # Full Docker-based E2E run
```

## Architecture

### Client-Server Communication

REST API over axios. All endpoints prefixed with `/api`. Endpoint constants defined in `shared/constants/apiEndpoints.ts`. Dev client runs on port 8000, production server on port 5000.

### Server Feature Structure

`server/src/features/{feature}/` — each feature has controllers, services, and Mongoose schemas. Controllers handle HTTP, services contain business logic. Key features: `assignment/` (lottery algorithms), `direct-signup/`, `user/`, `kompassi-login/`, `program-item/`.

### Assignment System

Two lottery algorithms: PADG (preference-based via `eventassigner-js`) and random (`eventassigner-random`). Admin triggers assignment runs. Users submit weighted preferences during signup windows defined per-event in `shared/config/`.

### Authentication

Local login (bcryptjs) and Kompassi OAuth. JWT tokens stored in localStorage. User roles: admin, helper, regular user.

### Event Configuration

Current event config in `shared/config/eventConfig.ts`, past events in `shared/config/past-events/` (e.g., `ropecon2025.ts`). Controls signup windows, program item types, assignment rules.

### Program Item Cancellation Types

A program item can effectively "go away" in four distinct ways; each has different data-cleanup semantics:

1. **Cancelled** — `state: "cancelled"` in DB. Item stays visible (so users know it was cancelled).
2. **Deleted** — the program item document is removed from the DB entirely. All related records (lottery signups, favorites, direct signups, etc.) should also be removed.
3. **Signup type changed** — item stays in DB with `state: "accepted"`, but `signupType` is no longer `KONSTI` (e.g. moved to `OTHER`). No new Konsti signups possible.
4. **Program type changed to non-lottery** — item stays in DB with `state: "accepted"` and `signupType: "konsti"`, but `programType` is no longer in `twoPhaseSignupProgramTypes` (e.g. changed from `TABLETOP_RPG` to `OTHER`). Lottery is no longer meaningful for this item; use `isLotterySignupProgramItem` to detect this state.

Cleanup rules (admin-import path, `notify: true`):

| Case               | Lottery signup                                             | Direct signup    | Favorite |
| ------------------ | ---------------------------------------------------------- | ---------------- | -------- |
| Cancelled          | Preserve if lottery already ran, otherwise remove + notify | Remove + notify  | Keep     |
| Deleted            | Remove + notify                                            | Remove + notify  | Remove   |
| SignupType change  | Preserve if lottery already ran, otherwise remove + notify | Remove + notify  | Keep     |
| ProgramType change | Preserve if lottery already ran, otherwise remove + notify | Keep (no notify) | Keep     |

Lottery signup cleanup lives in `removeCanceledDeletedProgramItemsFromUsers` (`server/src/features/assignment/utils/removeInvalidProgramItemsFromUsers.ts`); preservation is gated on `timeNow >= getLotterySignupEndTime(programItem)`. Direct signup cleanup lives in `handleCanceledDeletedProgramItems` (`server/src/features/program-item/programItemUtils.ts`); it does not touch direct signups for programType-only changes because the item still exists and still uses Konsti signup (direct signup remains valid whether the lottery has run or not). The lottery-signup path deduplicates event log entries when a user has both a lottery and a direct signup for the same item, so there's no double notification.

Pre-assignment cleanup (`runAssignment.ts` → `notify: false`) calls the same function with the same preservation semantics; the `notify: false` flag only suppresses the `PROGRAM_ITEM_CANCELED` event-log notifications. This path is a safety net — invalid signups should already have been handled when the program items were updated.

### Program Item Parent Start Times

A program item can have a `parentId` linking it to a parent (e.g. sub-sessions of a longer program). The event config `startTimesByParentIds: Map<parentId, startTime>` can override the effective start time for lottery/signup-window calculations. The parent override exists to batch multiple own start times into a single lottery run. The resolution pattern is `startTimesByParentIds.get(parentId) ?? programItem.startTime`; the shared helper is `getProgramItemStartTime` in `shared/utils/signupTimes.ts` (file-scoped), and downstream helpers like `getLotterySignupEndTime`, `getLotterySignupStartTime`, and `getDirectSignupStartTime` already apply it — prefer reusing them over reimplementing the override inline.

**`signedToStartTime` invariant:**

- **Lottery signups** store the program item's **own** `startTime` in `signedToStartTime` (what time the item actually happens for the user).
- **Direct signups** store the **parent-resolved** start time (`parentStartTime ?? programItem.startTime`) in `signedToStartTime`. This is required so that when the lottery is re-run for a batch, the old direct signups for that batch can be cleaned up by matching the shared parent time.

When adding new code that writes `signedToStartTime`, follow this split. When adding time comparisons, use the parent-resolved time for lottery-window logic and own `startTime` for per-item semantics (e.g. "has this program item started for the user").

### Database

MongoDB with Mongoose. Tests use `mongodb-memory-server` for in-memory DB. Docker Compose config in `docker/`.

### State Management

Client uses Redux Toolkit. Store in `client/src/state/`. API calls in `client/src/services/`.

## Test Data Credentials

- Admin: `admin:test`
- Regular users: `test1:test`, `test2:test`, `test3:test`
- Group users: `group1:test`, `group2:test`, `group3:test`
- Helper: `helper:test`
