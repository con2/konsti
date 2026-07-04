# server/CLAUDE.md

Guidance for working in the `server/` workspace (Express 5 + MongoDB/Mongoose backend). See the [root CLAUDE.md](../CLAUDE.md) for the project overview, monorepo layout, and cross-cutting conventions, and [shared/CLAUDE.md](../shared/CLAUDE.md) for the types/config/utilities this workspace imports.

## Scripts

Run from the repo root as `yarn workspace server <script>` (or via the root shortcuts noted below). Everything runs through `tsx` — there is no compile step.

| Script                                                                                                | What it does                                                                                                                         |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `start`                                                                                               | Run the server with `tsx src/index.ts` (this is what production runs)                                                                |
| `start:dev`                                                                                           | Dev server, `NODE_ENV=development SETTINGS=development`, `tsx watch` with `.env.development` (root: `yarn server`)                   |
| `start:test`                                                                                          | Same as `start:dev` but loads `.env.test` (root: `yarn server:test`)                                                                 |
| `start:test:coverage`                                                                                 | Same as `start:test` but without watch; used by the combined-coverage flow (`yarn coverage`, root CLAUDE.md) with `NODE_V8_COVERAGE` |
| `test` / `test:watch`                                                                                 | Vitest unit/integration tests against `mongodb-memory-server`; coverage runs at the root (`yarn coverage:vitest`)                    |
| `type-check`                                                                                          | `tsc --noEmit`                                                                                                                       |
| `eslint`                                                                                              | ESLint for this workspace                                                                                                            |
| `docker:db`                                                                                           | Start the local MongoDB container (port 27017); called automatically by `start:dev`                                                  |
| `generate-data`                                                                                       | Test-data CLI (`src/test/test-data-generation/generateTestDataCli.ts`); the root `populate-db:*` scripts wrap this with flag sets    |
| `initialize-db` / `generate-serials`                                                                  | DB setup and user-serial generation utilities                                                                                        |
| `load-past-event-data` / `update-kompassi-data` / `update-kompassi-datadump`                          | Load past-event dumps / Kompassi fixtures into the DB                                                                                |
| `stats` / `stats:gen-docs` / `fixer`                                                                  | Statistics generation, docs generation, and the past-event datafile fixer (`src/features/statistics/`)                               |
| `test-assign` / `verify-results` / `update-popularity` / `check-start-times` / `remove-invalid-games` | One-off dev scripts under `src/test/scripts/`                                                                                        |
| `find-unused-translation-keys`                                                                        | Scans **`client/src`** for unused i18next keys (the detector lives here but checks the client; wired into `yarn lint`)               |

`generate-data`, `update-kompassi-data`, and `load-past-event-data` preload `server/.env.development` (via `DOTENV_CONFIG_PATH` + `-r dotenv/config`, like `start:dev`) and — like `start:dev`/`start:test` — also preload `src/utils/applyPortOffset.ts` (`--import`), which resolves the per-worktree `PORT_OFFSET` from the shared registry (`scripts/portOffset.ts`) so each worktree's scripts target that instance's own database. An explicit `PORT_OFFSET` (shell or `.env` file) wins over the automatic assignment; Node runs `--require` before `--import`, so dotenv-loaded values are visible to the preload. `generate-data` uses the env-var form instead of the trailing `dotenv_config_path=...` argv form on purpose — a trailing arg would break its commander `process.argv.length < 3` help check.

## Directory Layout (`server/src`)

- **`index.ts`** — entry point (ESM). Does **not** import `utils/instrument.ts` directly; Sentry is initialized via the `--import=./src/utils/instrument.ts` Node preload in the `start` scripts (see Sentry note below).
- **`api/`** — route tables. `apiRoutes.ts` (the main router) and `sentryRoutes.ts` (separate router for the Sentry tunnel, mounted before `express.json()`).
- **`features/{feature}/`** — feature modules: `admin`, `assignment`, `direct-signup`, `health`, `kompassi-login`, `notifications`, `program-item`, `program-item-popularity`, `results`, `sentry-tunnel`, `serial`, `settings`, `statistics`, `user`. Each has controllers (HTTP), services (business logic), and Mongoose schemas/repositories.
- **`middleware/`** — `requireAuth.ts`, `validateRequest.ts` (exports both `validateBody` and `validateQuery`), `logApiCall.ts`, `cors.ts`, `wwwRedirect.ts`.
- **`db/`** — `mongodb.ts` (connection lifecycle) and `mongoosePlugins.ts` (global plugins).
- **`utils/`** — cross-cutting helpers: `server.ts` (Express app assembly), `logger.ts` (winston), `instrument.ts` (Sentry), `applyPortOffset.ts` (per-worktree `PORT_OFFSET` preload, see Scripts above), `cron.ts` (scheduled jobs), `notificationQueue.ts` (email queue), `jwt.ts`, `bcrypt.ts`, `authHeader.ts`, `zodUtils.ts`, etc.
- **`types/`** — server-only types (`assignmentTypes.ts`, `jwtTypes.ts`, `serialTypes.ts`, `userTypes.ts`, `resultTypes.ts`, `declarations/`). Domain models live in `shared/types/models/`.
- **`kompassi/`** — event-specific Kompassi OAuth/import logic (`ropecon/`, `tracon/`, etc.).
- **`test/`** — `globalSetup.ts` + `setupTests.ts`, `mock-data/`, `utils/` (test helpers), `test-data-generation/`, `kompassi-mock-service/` (registered only in `development`), `test-settings/`, `scripts/`.

## Build & Run Model

- **Dev:** `tsx watch` re-runs `src/index.ts` on change; env from `.env.development` via `dotenv`.
- **Production:** the root multi-stage `Dockerfile` builds the client (`yarn workspace client build:$env`), copies `client/build` → **`server/front`** (served as static assets), installs production deps with `yarn workspaces focus --all --production`, and runs `dumb-init yarn start` — i.e. **`tsx src/index.ts` directly, no `tsc`/`dist` step**.
- The server serves the built SPA from `server/front/` and the API from the same Express app (port 5000).

## Environment & Config

- Two env vars drive configuration: **`NODE_ENV`** (`development` | `ci` | `staging` | `production` | `test`) and **`SETTINGS`** (selects the server config profile). Read config through `config.server()` / `config.event()` / `config.sentry()` from `shared/config` — see [shared/CLAUDE.md](../shared/CLAUDE.md).
- `.env.development` (local), `.env.test` (test runs), `.env.sample` (template — copy and fill Kompassi OAuth creds; never commit secrets).
- Feature toggles like the cron jobs and time-mocking are config-gated (off in production for time-mocking, on for cron).

## Route & Middleware Conventions

Routes in `server/src/api/apiRoutes.ts` follow a fixed middleware chain:

```ts
apiRoutes.post(
  ApiEndpoint.X,
  requireAuth(UserGroup.X), // 401 if not authenticated / wrong role
  validateBody(SomeRequestSchema), // 422 if zod parse fails
  handler,
);
```

For GETs with query strings, use `validateQuery(...)` instead of (or in addition to) `validateBody(...)`. Schemas live in `shared/types/api/...` (or `shared/test-types/api/...` for dev/test); routes import the schema, controllers import the inferred type only and read parsed data straight off `req.body` / `req.query` — don't re-parse in the controller. Both validators live in `server/src/middleware/validateRequest.ts`.

Handler signature: `req: Request<unknown, unknown, RequestBody, RequestQuery>`. Handlers needing the authenticated user call `getAuthUsername(req)` from `server/middleware/requireAuth` — the middleware sets `req.auth = { username }` and the helper enforces presence at runtime (throws if `requireAuth` wasn't wired).

`requireAuth(group)` is an **explicit allow-list, not a role hierarchy** — `admin` is _not_ automatically granted helper/user routes. Pass an array to allow several roles (e.g. `requireAuth([UserGroup.HELPER, UserGroup.ADMIN])` on `getUserBySerialOrUsername`). Some routes are deliberately single-role: `getSignupMessages` is `requireAuth(UserGroup.HELPER)`, so an admin token gets 401 — list every role that needs access.

Other middlewares:

- `logApiCall` (mounted on `apiRoutes` only, not `sentryRoutes`) writes one access line per request via winston on response finish: `API call: METHOD /path STATUS Xms user=X ip=Y size=Z`. Skips OPTIONS preflights and strips `::ffff:` from IPv4-mapped IPs. Replaces morgan, which has been removed.
- `app.set("trust proxy", 1)` is unconditional (safe in dev because the server only binds to localhost; production reads `X-Forwarded-For` from k8s ingress).

Intentional divergences from the standard chain:

- **`postUpdateUserEmailAddress`** keeps inline `safeParse` because its 422 response is a custom JSON body (`{message, status, errorId: "invalidEmail"}`), which `validateBody`'s plain `sendStatus(422)` can't produce.
- **`postSentryTunnel`** lives in `server/src/api/sentryRoutes.ts` (separate router, mounted before `express.json()`) because it accepts raw `Buffer` envelopes from Sentry's client SDK rather than JSON. It does its own inline `logger.info(...)` since `logApiCall` isn't mounted on that router.
- **`getProgramItems`** uses `getAuthorizedUserGroup` instead of `requireAuth` because it intentionally allows unauthenticated callers and varies its response by role.
- **Kompassi mock service** (`server/src/test/kompassi-mock-service/`) routes are registered only when `NODE_ENV === "development"` and `throw` on validation failure rather than 422 — they're test fixtures, not user-facing endpoints.

Dev-only test endpoints are gated in two tiers:

- **`postTestSettings` / `getTestSettings`, `postAddSerials`** — registered in `development`, `ci`, **and `staging`**: the staging client calls `GET /api/test-settings` on app load (before login) to read the time-mocking override (removing it from staging breaks the SPA bootstrap), and `postAddSerials` backs the client's test-widget "Generate code" button, which is used in staging too.
- **`postPopulateDb`, `postClearDb`, `postAddProgramItems`, `postWriteCoverage`** — registered only in `development` and `ci`. The first three are destructive (DB wipe/repopulate, fixture generation) and have no use in staging; `postWriteCoverage` (`server/src/test/coverage/coverageController.ts`) flushes V8 coverage to `NODE_V8_COVERAGE` for the combined-coverage flow (`yarn coverage`, see the root CLAUDE.md).

Both tiers stay out of `production` and have an `if (NODE_ENV === "production") throw` belt-and-braces guard inside the handler.

Express 5 quirks to watch for:

- `req.query` is a getter; `validateQuery` uses `Object.defineProperty` to overwrite it with the parsed value (direct assignment is unsafe).
- Async errors from handlers propagate to the error middleware natively — no `asyncHandler` wrapper needed.

## Result Type Idiom

Server code returns errors as values via `Result<T, E>` (defined in `shared/utils/result.ts` — see [shared/CLAUDE.md](../shared/CLAUDE.md) for the type and constructors). Read by narrowing on `.ok` directly — there are no `isErrorResult` / `isSuccessResult` / `unwrapResult` helpers (they existed historically and were removed; don't reintroduce them).

Standard idiom:

```ts
const usersResult = await findUsers();
if (!usersResult.ok) {
  return { message: "...", status: "error", errorId: "unknown" };
}
// use usersResult.value
```

When the unwrapped value is used **once**, inline `usersResult.value` at the use site rather than extracting a `const users = usersResult.value;` line. When it's used **multiple times**, extract to a `const` with the noun name (`user`, `settings`, etc.) and keep the `Result` suffix on the wrapper.

## Authentication

Local login (bcryptjs) and Kompassi OAuth. JWTs are signed/verified in `server/src/utils/jwt.ts` (per-role secret keys); the `Authorization: Bearer <jwt>` header is parsed in `utils/authHeader.ts` and enforced by `requireAuth`. User roles: admin, helper, regular user (`UserGroup` in `shared/types/models/user.ts`). The client stores the JWT in localStorage — see [client/CLAUDE.md](../client/CLAUDE.md).

## Rate Limiting

There is **no application-level rate limiting**. This is intentional:

- Convention attendees connect via venue-shared NAT'd WiFi (hundreds of users behind one public IP). Per-IP rate limiting either throttles legitimate users or is set so high it does nothing against attackers.
- Per-username throttling on `/login` was rejected because it lets one attendee lock out another by spamming wrong passwords for that account.

## Assignment System

Two lottery algorithms: PADG (preference-based via `eventassigner-js`) and random (`eventassigner-random`), under `server/src/features/assignment/`. Assignment runs automatically on a cron schedule; admins can trigger manual runs as a backup. Users submit weighted preferences during signup windows defined per-event in `shared/config/`. The orchestrator (`run-assignment/`) cleans up invalid signups before running (see below).

**Assignment test organization** (`run-assignment/`): put generic, algorithm-independent behavior — start-time filtering, signup cleanup/preservation, result snapshots, error cases — in `runAssignment.test.ts`. The per-algorithm files (`runAssignmentPadg.test.ts`, `runAssignmentRandom.test.ts`, `runAssignmentRandomPadg.test.ts`) hold only cases specific to that algorithm. New generic cases go in `runAssignment.test.ts`.

## Program Item Cancellation Types

A program item can effectively "go away" in four distinct ways; each has different data-cleanup semantics:

1. **Cancelled** — `state: "cancelled"` in DB. Item stays visible (so users know it was cancelled).
2. **Deleted** — the program item document is removed from the DB entirely. All related records (lottery signups, favorites, direct signups, etc.) should also be removed.
3. **Signup type changed** — item stays in DB with `state: "accepted"`, but `signupType` is no longer `KONSTI` (e.g. moved to `OTHER`). No new Konsti signups possible.
4. **Program type changed to non-lottery** — item stays in DB with `state: "accepted"` and `signupType: "konsti"`, but `programType` is no longer in `twoPhaseSignupProgramTypes` (e.g. changed from `TABLETOP_RPG` to `OTHER`). Lottery is no longer meaningful for this item; use `isLotterySignupProgramItem` to detect this state.

Cleanup rules (admin-import path, `notify: true`):

| Case               | Lottery signup                                             | Direct signup    | Favorite        |
| ------------------ | ---------------------------------------------------------- | ---------------- | --------------- |
| Cancelled          | Preserve if lottery already ran, otherwise remove + notify | Remove + notify  | Keep            |
| Deleted            | Remove + notify                                            | Remove + notify  | Remove + notify |
| SignupType change  | Preserve if lottery already ran, otherwise remove + notify | Remove + notify  | Keep            |
| ProgramType change | Preserve if lottery already ran, otherwise remove + notify | Keep (no notify) | Keep            |

Lottery signup cleanup lives in `removeCancelledDeletedProgramItemsFromUsers` (`server/src/features/assignment/utils/removeInvalidProgramItemsFromUsers.ts`); preservation is gated on `timeNow >= getLotterySignupEndTime(programItem)`. Direct signup cleanup lives in `handleCancelledDeletedProgramItems` (`server/src/features/program-item/programItemUtils.ts`); it does not touch direct signups for programType-only changes because the item still exists and still uses Konsti signup (direct signup remains valid whether the lottery has run or not). The lottery-signup path deduplicates event log entries when a user has both a lottery and a direct signup for the same item, so there's no double notification.

Each case emits its own event log action so the user sees a case-specific message: **Cancelled** uses `PROGRAM_ITEM_CANCELLED`, **Deleted** uses `PROGRAM_ITEM_DELETED`, **SignupType change** uses `PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE`, and **ProgramType change** uses `PROGRAM_ITEM_NO_LOTTERY_ANYMORE` (enum in `shared/types/models/eventLog.ts`, rendered client-side by the matching `EventLogProgramItem*` components and `eventLogActions.*` locale keys). The lottery path picks the action via the `getCancellationAction` classifier; the direct-signup path routes each bucket through `notifyUsersWithDirectSignups` with the matching action.

Pre-assignment cleanup (`runAssignment.ts` → `notify: false`) calls the same function with the same preservation semantics; the `notify: false` flag only suppresses these cancellation event-log notifications. This path is a safety net — invalid signups should already have been handled when the program items were updated.

When writing `signedToStartTime` for signups, follow the lottery-vs-direct split documented in [shared/CLAUDE.md](../shared/CLAUDE.md) (lottery stores the item's own `startTime`; direct stores the parent-resolved time).

## Cross-Cutting Server Patterns

- **Logging:** winston logger in `server/src/utils/logger.ts` — human-readable in dev, JSON in production; error-level logs are also forwarded to Sentry (`winston-transport-sentry-node`). Logging is mocked off in tests unless explicitly enabled in config. Log errors by passing the `Error` directly — `logger.error(new Error("context"))`, or wrap an underlying error as the cause — `logger.error(new Error("context", { cause: err }))`. **Do not use the old `logger.error("%s", new Error(...))` idiom**: the `%s` is unnecessary (the logger surfaces the Error to Sentry and renders the stack/cause itself) and stringifying the Error into the message produced a doubled `Error: Error:` prefix in Sentry.
- **Error handling:** the final Express error middleware (in `utils/server.ts`) logs and responds 500; a JSON body-parse guard handles malformed bodies as 400; `@sentry/node`'s express error handler captures exceptions. Prefer returning `Result` errors from services over throwing.
- **Sentry:** initialized in `utils/instrument.ts`; DSN/sample rate from `config.sentry()`. Under ESM, importing `instrument.ts` from `index.ts` is **not enough** to auto-instrument Express — by the time `Sentry.init()` runs, Express is already linked and can't be wrapped (you'd see `[Sentry] express is not instrumented`). The `start` / `start:dev` / `start:test` scripts therefore preload it with Node's `--import=./src/utils/instrument.ts` flag (via `tsx`), which registers the OpenTelemetry import hooks before the app module graph loads. The `release` is read from `process.env.SENTRY_RELEASE` (set to the git SHA in the runner image, matching the release `deploy.yml` creates in `konsti-backend-{env}`); it's `undefined` locally. Unlike the frontend maps/release — which upload during the image **build** — the backend release is created **after** a successful `deploy` (the `backend-sentry-release` job, `needs: deploy`), so a failed deploy creates no backend release.
- **Cron jobs:** scheduled in `utils/cron.ts` using `croner` (e.g. auto-updating program items from Kompassi and auto-running assignment), toggled per-environment via server config; guards prevent a stale server instance from running a job.
- **Email notifications:** queued through `utils/notificationQueue.ts` (a `fastq` queue) and sent via `nodemailer`.
- **Security & static serving:** `helmet` for headers; the SPA in `server/front/` is served with `express-static-gzip` (brotli/gzip).
- **Mongoose conventions:** global plugins in `db/mongoosePlugins.ts` (lean getters/virtuals via `mongoose-lean-getters`/`mongoose-lean-virtuals`, `toJSON` transforms that strip `_id`/`__v`). Connection lifecycle in `db/mongodb.ts`. Dates use `dayjs` (initialized via `shared/utils/initializeDayjs`).

## Database

MongoDB with Mongoose. Tests use `mongodb-memory-server` for an in-memory DB. Docker Compose config in `docker/`; the local dev DB container starts via `yarn workspace server docker:db` (port 27017).

**Lifecycle:** each convention runs its own instance for the duration of the event only. After the event the DB is dumped to `server/src/features/statistics/datafiles/` and the instance is torn down. Because there is no long-lived production DB and no cross-event continuity, schema or enum-value changes don't need migration files — just change the code and let the next event start with a fresh DB. Do not add migration scripts, startup migration hooks, or backwards-compatibility shims.

## Past-event Datafiles

Sanitized DB dumps from every event live under `server/src/features/statistics/datafiles/{event}/{year}/`. They've been normalized so all years share one schema (Ropecon 2025 is the canonical reference). Full schema in [`docs/en/datafiles-guide.md`](../docs/en/datafiles-guide.md). Aggregated stats live under [`docs/statistics/`](../docs/statistics/). Past-event config files in [`shared/config/past-events/`](../shared/config/past-events/) are typed `Partial<EventConfig>`; configs for 2017–2022 + Hitpoint 2019 were reconstructed from the dumps and carry a notice header.

Non-obvious invariants when analysing the dumps:

- **Signup priority semantics** (`direct-signups.json` `userSignups[].priority`, `results.json` `assignmentSignup.priority`): `0` = first-come-first-served direct signup; `1`/`2`/`3` = lottery win at that preference. 2017–2019 events have only `1`/`2`/`3` (lottery-only era); 2021 Ropecon has only `0` (remote / COVID, direct signup only); 2022+ events mix both.
- **Group creator identification**: a user is the group creator iff `user.isGroupCreator === true` (a creator's `groupCode` is the group's own code). Regular members have `isGroupCreator: false`. In 2018–2023 dumps the `groupCode` happens to equal the creator's `serial`; from 2024 onward it's a UUID-style string.
- **`kompassiId` types**: `0` (number) means registration-code user, `"<redacted>"` (string) means Kompassi-OAuth user. The split only exists in events with `loginProvider: "local+kompassi"` (Ropecon 2025+); single-method events have one value across all rows.
- **`popularity` scale history**: Ropecon 2025 introduced the 5-bucket enum (`notSet`/`low`/`medium`/`high`/`veryHigh`/`extreme`). Earlier dumps used a numeric scale that only encoded 3 buckets (`low` = under min attendance, `medium` = between, `high` = at max), so older normalized dumps never have `veryHigh` or `extreme`.
- **`lotterySignups[]` schema** (in `users.json`): `{programItemId, priority, signedToStartTime}` — no `message` field. Direct-signup `userSignups[]` does include `message`.
- **Algorithm naming history**: `algorithm` field is canonicalized — `Opa` was the older name for `padg`, `Group` was the older name for `random`. 2017 used `hungarian` (no longer in the codebase enum).

## Testing

Vitest with `mongodb-memory-server`. `src/test/globalSetup.ts` spins up the in-memory Mongo (port `47233`); `src/test/setupTests.ts` initializes dayjs, mocks the logger, stubs the event config to a fixed test time, and exposes the connection string as `globalThis.__MONGO_URI__`. Mock fixtures live in `src/test/mock-data/`; shared fixtures like `testProgramItem` come from `shared/tests/`.

**Prefer controller (integration) tests for cross-cutting behavior.** Whenever a behavior is observable through an endpoint — auth/role gating, request validation, concurrency guards, or the full request→service→DB effect — test it in the feature's `*Controller.test.ts` via `supertest` so it exercises the whole HTTP→service→DB path, rather than calling the service function directly. Reserve narrower unit tests for logic that isn't reachable (or is awkward to drive) through the endpoint.

**Controller (integration) tests** drive the real Express app with `supertest`. The standard shape:

```ts
let server: Server;
beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10), // unique DB per test avoids cross-test pollution
  });
});
afterEach(async () => await closeServer(server));

// Authenticate by minting a JWT for the required role
const response = await request(server)
  .post(ApiEndpoint.X)
  .send(body)
  .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "username")}`);
```

**Never use Mongoose Models directly in tests** — always seed and read DB state through the feature's repository functions (`saveUser`/`findUser`, `findSettings`, `setAssignmentLastRun`, etc.). When a repository has no helper for the exact state you need, prefer an existing function (e.g. `findSettings` creates a default row) or control inputs another way (e.g. mock the clock with `vi.setSystemTime`) instead of reaching for the Model — this keeps tests decoupled from the schema and exercises the same code paths as production. Unwrap `Result` values via `unsafelyUnwrap` from `src/test/utils/` rather than reintroducing production unwrap helpers. Cast `response.body` to the expected shape and assert directly — do **not** wrap `expect` in conditionals (`vitest/no-conditional-expect` forbids it). Avoid asserting on real email/network side effects; they aren't available in unit runs.
