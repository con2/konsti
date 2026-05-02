# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Konsti is an event signup tool for conventions (Ropecon, Tracon, etc.). Users browse program items and sign up via lottery or direct signup (first-come-first-served). Supports group signups, Kompassi OAuth integration, and admin assignment management.

See [docs/terminology.md](docs/terminology.md) for the glossary of domain terms.

## Monorepo Structure

- **client/** — React 19 frontend (Vite, Redux Toolkit, styled-components, i18next for fi/en)
- **server/** — Express 5 backend (MongoDB/Mongoose, JWT auth, lottery assignment algorithms)
- **shared/** — Types, constants, configs, and utilities imported by client and server (not a Yarn workspace, used as a TypeScript path)
- **playwright/** — E2E tests
- **eslint-rules/** — Custom ESLint rules

Yarn 4 workspaces. Node >= 24.14.1. Use yarn, not npm. All code and scripts must be OS agnostic (Linux, Mac, Windows). Use exact dependency versions (e.g., `"vite": "7.3.1"`, not `"~7.3.1"` or `"^7.3.1"`). Client must support browsers released within the last 5 years.

## Code Style

- Don't end code comments with a period: write `// This is a comment`, not `// This is a comment.`

## Terminology

- Don't use "FCFS" as shorthand for "first-come-first-served" — write it out in full.

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

Two lottery algorithms: PADG (preference-based via `eventassigner-js`) and random (`eventassigner-random`). Assignment runs automatically on a cron schedule; admins can trigger manual runs as a backup. Users submit weighted preferences during signup windows defined per-event in `shared/config/`.

### Authentication

Local login (bcryptjs) and Kompassi OAuth. JWT tokens stored in localStorage. User roles: admin, helper, regular user.

### Rate Limiting

There is **no application-level rate limiting**. This is intentional:

- Convention attendees connect via venue-shared NAT'd WiFi (hundreds of users behind one public IP). Per-IP rate limiting either throttles legitimate users or is set so high it does nothing against attackers.
- Per-username throttling on `/login` was rejected because it lets one attendee lock out another by spamming wrong passwords for that account.

### Server Route & Middleware Conventions

Routes in `server/src/api/apiRoutes.ts` follow a fixed middleware chain:

```ts
apiRoutes.post(
  ApiEndpoint.X,
  requireAuth(UserGroup.X), // 401 if not authenticated / wrong role
  validateBody(SomeRequestSchema), // 422 if zod parse fails
  handler,
);
```

For GETs with query strings, use `validateQuery(...)` instead of (or in addition to) `validateBody(...)`. Schemas live in `shared/types/api/...` (or `shared/test-types/api/...` for dev/test); routes import the schema, controllers import the inferred type only and read parsed data straight off `req.body` / `req.query` — don't re-parse in the controller.

Handler signature: `req: Request<unknown, unknown, RequestBody, RequestQuery>`. Handlers needing the authenticated user call `getAuthUsername(req)` from `server/middleware/requireAuth` — the middleware sets `req.auth = { username }` and the helper enforces presence at runtime (throws if `requireAuth` wasn't wired).

Other middlewares:

- `logApiCall` (mounted on `apiRoutes` only, not `sentryRoutes`) writes one access line per request via winston on response finish: `API call: METHOD /path STATUS Xms user=X ip=Y size=Z`. Skips OPTIONS preflights and strips `::ffff:` from IPv4-mapped IPs. Replaces morgan, which has been removed.
- `app.set("trust proxy", 1)` is unconditional (safe in dev because the server only binds to localhost; production reads `X-Forwarded-For` from k8s ingress).

Intentional divergences from the standard chain:

- **`postUpdateUserEmailAddress`** keeps inline `safeParse` because its 422 response is a custom JSON body (`{message, status, errorId: "invalidEmail"}`), which `validateBody`'s plain `sendStatus(422)` can't produce.
- **`postSentryTunnel`** lives in `server/src/api/sentryRoutes.ts` (separate router, mounted before `express.json()`) because it accepts raw `Buffer` envelopes from Sentry's client SDK rather than JSON. It does its own inline `logger.info(...)` since `logApiCall` isn't mounted on that router.
- **`getProgramItems`** uses `getAuthorizedUserGroup` instead of `requireAuth` because it intentionally allows unauthenticated callers and varies its response by role.
- **Kompassi mock service** (`server/src/test/kompassi-mock-service/`) routes are registered only when `NODE_ENV === "development"` and `throw` on validation failure rather than 422 — they're test fixtures, not user-facing endpoints.

Dev-only test endpoints are gated in two tiers:

- **`postTestSettings` / `getTestSettings`** — registered in `development`, `ci`, **and `staging`** because the staging client calls `GET /api/test-settings` on app load (before login) to read the time-mocking override. Removing it from staging breaks the SPA bootstrap.
- **`postPopulateDb`, `postClearDb`, `postAddProgramItems`, `postAddSerials`** — registered only in `development` and `ci`. These are destructive (DB wipe/repopulate, fixture generation) and have no use in staging.

Both tiers stay out of `production` and have an `if (NODE_ENV === "production") throw` belt-and-braces guard inside the handler.

Express 5 quirks to watch for:

- `req.query` is a getter; `validateQuery` uses `Object.defineProperty` to overwrite it with the parsed value (direct assignment is unsafe).
- Async errors from handlers propagate to the error middleware natively — no `asyncHandler` wrapper needed.

### Result Type

Server code returns errors as values via `Result<T, E>` from `shared/utils/result.ts`, a tagged union:

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

Construct with `makeSuccessResult(value)` / `makeErrorResult(error)`. Read by narrowing on `.ok` directly — there are no `isErrorResult` / `isSuccessResult` / `unwrapResult` helpers (they existed historically and were removed; don't reintroduce them).

Standard idiom:

```ts
const usersResult = await findUsers();
if (!usersResult.ok) {
  return { message: "...", status: "error", errorId: "unknown" };
}
// use usersResult.value
```

When the unwrapped value is used **once**, inline `usersResult.value` at the use site rather than extracting a `const users = usersResult.value;` line. When it's used **multiple times**, extract to a `const` with the noun name (`user`, `settings`, etc.) and keep the `Result` suffix on the wrapper.

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

**Lifecycle:** each convention runs its own instance for the duration of the event only. After the event the DB is dumped to `server/src/features/statistics/datafiles/` and the instance is torn down. Because there is no long-lived production DB and no cross-event continuity, schema or enum-value changes don't need migration files — just change the code and let the next event start with a fresh DB. Do not add migration scripts, startup migration hooks, or backwards-compatibility shims.

### Past-event Datafiles

Sanitized DB dumps from every event live under `server/src/features/statistics/datafiles/{event}/{year}/`. They've been normalized so all years share one schema (Ropecon 2025 is the canonical reference). Full schema in [`docs/en/datafiles-guide.md`](docs/en/datafiles-guide.md). Aggregated stats live under [`docs/statistics/`](docs/statistics/). Past-event config files in [`shared/config/past-events/`](shared/config/past-events/) are typed `Partial<EventConfig>`; configs for 2017–2022 + Hitpoint 2019 were reconstructed from the dumps and carry a notice header.

Non-obvious invariants when analysing the dumps:

- **Signup priority semantics** (`direct-signups.json` `userSignups[].priority`, `results.json` `assignmentSignup.priority`): `0` = first-come-first-served direct signup; `1`/`2`/`3` = lottery win at that preference. 2017–2019 events have only `1`/`2`/`3` (lottery-only era); 2021 Ropecon has only `0` (remote / COVID, direct signup only); 2022+ events mix both.
- **Group creator identification**: a user is the group creator iff `user.groupCreatorCode === user.groupCode` (both non-`"0"`). Regular members have `groupCreatorCode: "0"`. In 2018–2023 dumps the `groupCode` happens to equal the creator's `serial`; from 2024 onward it's a UUID-style string.
- **`kompassiId` types**: `0` (number) means registration-code user, `"<redacted>"` (string) means Kompassi-OAuth user. The split only exists in events with `loginProvider: "local+kompassi"` (Ropecon 2025+); single-method events have one value across all rows.
- **`popularity` scale history**: Ropecon 2025 introduced the 5-bucket enum (`notSet`/`low`/`medium`/`high`/`veryHigh`/`extreme`). Earlier dumps used a numeric scale that only encoded 3 buckets (`low` = under min attendance, `medium` = between, `high` = at max), so older normalized dumps never have `veryHigh` or `extreme`.
- **`lotterySignups[]` schema** (in `users.json`): `{programItemId, priority, signedToStartTime}` — no `message` field. Direct-signup `userSignups[]` does include `message`.
- **Algorithm naming history**: `algorithm` field is canonicalized — `Opa` was the older name for `padg`, `Group` was the older name for `random`. 2017 used `hungarian` (no longer in the codebase enum).

### State Management

Client uses Redux Toolkit. Store in `client/src/state/`. API calls in `client/src/services/`.

## Test Data Credentials

- Admin: `admin:test`
- Regular users: `test1:test`, `test2:test`, `test3:test`
- Group users: `group1:test`, `group2:test`, `group3:test`
- Helper: `helper:test`
