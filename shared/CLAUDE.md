# shared/CLAUDE.md

Guidance for working in `shared/`. See the [root CLAUDE.md](../CLAUDE.md) for the project overview and cross-cutting conventions.

`shared/` is **not a Yarn workspace** — it's a plain TypeScript directory consumed **as source** (no build step, no `dist/`, no `package.json`) by both `client` and `server` via the `shared/*` path alias. The alias is defined in `shared/tsconfig.json` and wired into client/server tsconfig `include` and the client's Vite config (`tsconfigPaths`).

**Dependency direction is one-way:** client and server import from `shared`; `shared` must **never** import from `client` or `server`. Shared code must also stay platform-neutral (no DOM, no Node `fs`, etc.) and must **never reference i18next/translation keys** (the i18n instance lives only in the client). Because `shared` is type-checked by both sides, a change here can break either — run `yarn type-check` after editing.

## Directory Layout

- **`config/`** — application/event configuration, read everywhere through the `config` object (`shared/config/index.ts`): `config.event()`, `config.client()`, `config.server()`, `config.sentry()`.
  - `eventConfig.ts` + `eventConfigTypes.ts` — current event config and its types/enums.
  - `clientConfig.ts` / `serverConfig.ts` / `sentryConfig.ts` (+ `clientConfigTypes.ts`) — per-surface config, environment-dependent.
  - `past-events/` — archived configs (e.g. `ropecon2025.ts`), typed `Partial<EventConfig>`.
- **`constants/`** — `apiEndpoints.ts` (`ApiEndpoint`, `ApiDevEndpoint`, `AuthEndpoint`), `browserStorage.ts` (`browserStoragePrefix`/`localStorageStateKey`, the event-prefixed browser storage keys shared by client and playwright — see the root CLAUDE.md's Database Lifecycle section), `signups.ts` (e.g. `DIRECT_SIGNUP_PRIORITY = 0`), `validation.ts` (username/password/message length bounds used by zod schemas).
- **`types/`**
  - `api/` — API request/response contracts (one file per domain: `login.ts`, `users.ts`, `programItems.ts`, `assignment.ts`, …). See the zod pattern below.
  - `models/` — domain models (`programItem.ts`, `user.ts`, `settings.ts`, `eventLog.ts`, `groups.ts`, `signupMessage.ts`) and their enums (`ProgramType`, `SignupType`, `UserGroup`, `Popularity`, `State`, …).
  - `errors.ts` lives under `api/`; `locale.ts` and `emailNotification.ts` are top-level.
- **`test-types/`** — zod schemas and types for the **dev/test-only** endpoints (`api/`, `models/`), mirroring `types/` but never imported by production code (e.g. `TestSettings`, populate-db request schemas).
- **`tests/`** — shared test fixtures, notably `testProgramItem.ts` (fully-populated objects used by both server and playwright tests).
- **`utils/`** — see below.
- **`setupTests.ts` + `vitest.config.ts`** — `shared`'s own vitest setup (`environment: "node"`, runs `initializeDayjs()` before tests).

## Utilities (`shared/utils`)

- **`result.ts`** — the `Result<T, E>` tagged union and its constructors (see below).
- **`signupTimes.ts`** — lottery/direct signup window calculations (`getLotterySignupStartTime`/`…EndTime`, `getDirectSignupStartTime`/`…EndTime`, in-progress/ended predicates). Applies the parent start-time override (see below).
- **`timeFormatter.ts`** — dayjs-based display formatting; everything is forced to the `Europe/Helsinki` timezone.
- **`initializeDayjs.ts`** — dayjs plugin/locale setup and the `TIMEZONE` constant; call this in any new test setup that touches time.
- **`isLotterySignupProgramItem.ts`** — predicate: does an item use two-phase (lottery) signup?
- **`isDirectSignupAlwaysOpen.ts`** — predicate: is an item's direct signup always open? Combines the manual `directSignupAlwaysOpenIds` config list with a programmatic check for the `Tag.PRE_CONVENTION_WEEK` tag (pre-convention-week items always use direct signup, even lottery program types like RPGs). Consumed by `isLotterySignupProgramItem` and `getDirectSignupStartTime`.
- **`getProgramItemValidity.ts`** — per-check validity flags for a program item (attendance limits, signup type, lottery even-hour start) plus the combined `allValuesValid`. Invalid items can't be signed up to: the client hides the signup section and renders the errors, and the server's lottery/direct signup services reject with the `invalidProgramItem` error.
- **`tooEarlyForLotterySignup.ts`**, **`isStartTimeChanged.ts`**, **`exhaustiveSwitchGuard.ts`** (TS exhaustiveness helper that throws on unreachable cases), **`remedaExtend.ts`** (extra collection helpers), **`setLocale.ts`**.

## Zod Pattern for API Types

API request schemas are zod schemas; the inferred type follows immediately and is what client/server code uses:

```ts
export const PostUserRequestSchema = z.object({
  username: z.string().trim().min(USERNAME_LENGTH_MIN),
  // ...
});
export type PostUserRequest = z.infer<typeof PostUserRequestSchema>;
```

- The **server route** imports the _schema_ (`validateBody(PostUserRequestSchema)`); the **controller** imports only the inferred _type_ and reads parsed data off `req.body`/`req.query` — see [server/CLAUDE.md](../server/CLAUDE.md).
- The **client** imports the inferred request/response types in its `services/` layer — see [client/CLAUDE.md](../client/CLAUDE.md).
- Responses are tagged unions of a success interface (`extends ApiResult`) and an error interface (`extends ApiError`, with an `errorId`); base shapes are in `types/api/errors.ts`.

## Result Type

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

Construct with `makeSuccessResult(value)` / `makeErrorResult(error)`. Read by narrowing on `.ok` directly — there are **no** `isErrorResult` / `isSuccessResult` / `unwrapResult` helpers (they existed historically and were removed; don't reintroduce them). The server-side usage idiom (once-vs-multiple-use naming, error-return shape) is documented in [server/CLAUDE.md](../server/CLAUDE.md).

## Event Configuration

Current event config in `shared/config/eventConfig.ts`, past events in `shared/config/past-events/` (e.g. `ropecon2025.ts`). Controls signup windows, program item types (`twoPhaseSignupProgramTypes`, `activeProgramTypes`), assignment rules, and start-time overrides. Read via `config.event()`.

## Program Item Parent Start Times

A program item can have a `parentId` linking it to a parent (e.g. sub-sessions of a longer program). The event config `startTimesByParentIds: Map<parentId, startTime>` can override the effective start time for lottery/signup-window calculations. The parent override exists to batch multiple own start times into a single lottery run. The resolution pattern is `startTimesByParentIds.get(parentId) ?? programItem.startTime`; the shared helper is `getProgramItemStartTime` in `shared/utils/signupTimes.ts` (file-scoped), and downstream helpers like `getLotterySignupEndTime`, `getLotterySignupStartTime`, and `getDirectSignupStartTime` already apply it — prefer reusing them over reimplementing the override inline.

**`signedToStartTime` invariant:**

- **Lottery signups** store the program item's **own** `startTime` in `signedToStartTime` (what time the item actually happens for the user).
- **Direct signups** store the **parent-resolved** start time (`parentStartTime ?? programItem.startTime`) in `signedToStartTime`. This is required so that when the lottery is re-run for a batch, the old direct signups for that batch can be cleaned up by matching the shared parent time.

When adding new code that writes `signedToStartTime`, follow this split. When adding time comparisons, use the parent-resolved time for lottery-window logic and own `startTime` for per-item semantics (e.g. "has this program item started for the user").

## Conventions

- Use enums/`as const` for closed sets (program types, signup types, user groups); use the `Result` tagged union for fallible operations.
- All time formatting must go through `timeFormatter.ts` / dayjs with the `Europe/Helsinki` timezone — never rely on the host's local timezone.
- No database migrations: events run on fresh, short-lived DBs, so enum/shape changes here need no migration or compatibility shim (see [root CLAUDE.md](../CLAUDE.md)).
