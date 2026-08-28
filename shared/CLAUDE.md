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
- **`vitest.config.ts`** — `shared`'s own vitest setup (`environment: "node"`). There is no setup file: the time utilities need no global initialization.

## Utilities (`shared/utils`)

- **`result.ts`** — the `Result<T, E>` tagged union and its constructors (see below).
- **`signupTimes.ts`** — lottery/direct sign-up window calculations (`getLotterySignupStartTime`/`…EndTime`, `getDirectSignupStartTime`/`…EndTime`, in-progress/started/ended predicates). Applies the parent start-time override (see below). The "open the previous evening at a fixed hour" path does its arithmetic on a `TZDate` in the event timezone and names the target hour explicitly, so it lands on the same wall-clock hour whether the previous day was 23, 24 or 25 hours long; `signupTimes.test.ts` pins both transitions. A `TZDate` serializes to its own offset rather than to UTC, so it is converted back to a plain `Date` before being returned — these values are stored and compared as ISO strings elsewhere. Also owns the two `lotteryRanForStartTime` predicates: `willNotBeLotteried`, the gate for offering a lottery at all, and `hasLotteryAlreadyRun`, the narrower "moved since its lottery" case that only the help text needs to tell apart. A mark while the lottery sign-up window is still open cannot have come from a run, since a run happens the minute that window shuts, so the item was passed over for holding sign-ups already. They live here rather than beside `isLotterySignupProgramItem` because `getDirectSignupStarted` needs them: direct sign-up never closes again once it has been open (choice 10 in [`docs/en/lottery-design-choices.md`](../docs/en/lottery-design-choices.md)). Ask "is direct sign-up open" through `getDirectSignupStarted`/`getDirectSignupInProgress` rather than comparing against `getDirectSignupStartTime` inline — the schedule-derived time still answers the run-gating question ("has the first-come phase for this hour begun"), which is a property of the start time, not of one item let out early.

  For a two-phase item, direct sign-up opens `phaseGap` after the lottery closes, and the event-start clamp is applied to **that** time rather than replacing it. Clamping the pre-gap time instead used to collapse the gap to zero for the first slot the lottery reaches, so direct sign-up opened while the lottery for those items was running — and a lottery program item has to be empty when it is lotteried (see [`docs/en/lottery-design-choices.md`](../docs/en/lottery-design-choices.md)).

- **`zonedTime.ts`** — `atWallClockHourInEventTimezone`, which resolves a wall-clock hour to an instant. Constructing a `TZDate` from components is not enough on its own: the hour the autumn transition repeats occurs twice, and which one the constructor lands on depends on the **host's** timezone, so a UTC server and a Finnish browser would disagree by an hour. This picks the first occurrence explicitly, and resolves the hour the spring transition skips forward.
- **`timeFormatter.ts`** — date-fns display formatting; everything is forced to the `Europe/Helsinki` timezone via `@date-fns/tz`. The `getLocal*` variants deliberately use the viewer's own timezone instead, for text that contrasts local time with Finnish time. `formatRelativeTime` (date-fns `formatDistance`) lives here too, so this is the only module that formats a time; `timeFormatter.test.ts` pins every string in both languages, because the event log shows them to attendees.
- **`timezone.ts`** — the `TIMEZONE` constant.
- **`setLocale.ts`** — the active date-fns locale. date-fns takes a locale per call rather than from global state, so the current one is held here and read by the formatters. It is also a store (`subscribeToLocale`/`getLocaleSnapshot`) behind the client's **`useTimeFormatters`** hook: everything the formatters produce depends on this module state, which React cannot see, so a component formatting a time would otherwise keep the weekday it first rendered while the text around it switched. The hook returns them bound to the active language, and a `no-restricted-imports` rule stops client code importing them directly, so call sites read as though the language were not a concern. Every formatter still takes it as an optional last argument; omitting it falls back to the module state, which is what non-rendering callers (server, scripts) want. Locales are imported one at a time (`date-fns/locale/fi`), never from the `date-fns/locale` barrel, which pulls in all 724 — a `no-restricted-imports` rule enforces both that and the formatting confinement. The Finnish locale is customized: date-fns abbreviates weekdays as `torst.` where the UI has always shown `to`, and English needs the abbreviated width unchanged, so this cannot be solved with a different format token.
- **`timeComparison.ts`** — `isSameOrAfter`/`isSameOrBefore` (date-fns has no direct equivalent) plus the two bounded-range checks whose edge behaviour matters.
- **`isLotterySignupProgramItem.ts`** — predicate: does an item use two-phase (lottery) sign-up? Answers "does the lottery allocate this program item at all" from program type plus always-open status; whether a lottery is still coming for a particular item is `willNotBeLotteried` in `signupTimes.ts`.
- **`isDirectSignupAlwaysOpen.ts`** — predicate: is an item's direct sign-up always open? Combines the manual `directSignupAlwaysOpenIds` config list with a programmatic check for the `Tag.PRE_CONVENTION_WEEK` tag (pre-convention-week items always use direct sign-up, even lottery program types like RPGs). Consumed by `isLotterySignupProgramItem` and `getDirectSignupStartTime`.
- **`getProgramItemValidity.ts`** — per-check validity flags for a program item (attendance limits, sign-up type, lottery even-hour start) plus the combined `allValuesValid`. The even-hour check deliberately skips items whose `parentId` has a `startTimesByParentIds` entry — the batch runs as one lottery at that admin-configured time, so it doesn't resolve the parent start time via `getProgramItemStartTime`. Invalid items can't be signed up to: the client hides the sign-up section and renders the errors, and the server's lottery/direct sign-up services reject with the `invalidProgramItem` error.
- **`tooEarlyForLotterySignup.ts`**, **`isStartTimeChanged.ts`**, **`exhaustiveSwitchGuard.ts`** (TS exhaustiveness helper that throws on unreachable cases), **`remedaExtend.ts`** (extra collection helpers), **`formatSerial.ts`** (hyphenates registration codes for display, e.g. 012-304-800-1).

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

Current event config in `shared/config/eventConfig.ts`, past events in `shared/config/past-events/` (e.g. `ropecon2025.ts`). Controls sign-up windows, program item types (`twoPhaseSignupProgramTypes`, `activeProgramTypes`), assignment rules, and start-time overrides. Read via `config.event()`.

## Program Item Parent Start Times

A program item can have a `parentId` linking it to a parent (e.g. sub-sessions of a longer program). The event config `startTimesByParentIds: Map<parentId, startTime>` can override the effective start time for lottery/sign-up-window calculations. The parent override exists to batch multiple own start times into a single lottery run. Both live in `shared/utils/signupTimes.ts`: **`getProgramItemStartTime(programItem)`** for the common case, and **`isSameStartTime(programItemStartTime, parentId, comparedTime)`** for callers asking whether a program item runs at some other time they hold — a sign-up's stored time, or the start time a lottery ran for. The override itself (`resolveStartTime`) is module-private; go through one of those two. Downstream helpers like `getLotterySignupEndTime`, `getLotterySignupStartTime`, and `getDirectSignupStartTime` already apply the override — reuse them, and never write `startTimesByParentIds.get(...) ?? ...` inline. A `.has(parentId)` check is a different question ("is this item part of a batch?") and legitimately stays as-is.

**`signedToStartTime` invariant:**

Both **lottery sign-ups** and **direct sign-ups** store the program item's **own** `startTime` in `signedToStartTime` — the hour the item actually happens for the attendee. Direct sign-ups once stored the parent-resolved time so a lottery re-run could find and clear the previous run's sign-ups by start time; the lottery runs once now, so nothing needs that (choice 11 in [`docs/en/lottery-design-choices.md`](../docs/en/lottery-design-choices.md)).

The parent override is for lottery _timing_ only: use the parent-resolved time to decide when a program item is lotteried and when its sign-up windows open (`getProgramItemStartTime`, `getStartingProgramItems`, the `signupTimes.ts` window helpers), and the item's own `startTime` for anything about a held spot — which hour it occupies, whether it moved, and what a won spot displaces.

## Conventions

- Use enums/`as const` for closed sets (program types, sign-up types, user groups); use the `Result` tagged union for fallible operations.
- All time formatting must go through `timeFormatter.ts` with the `Europe/Helsinki` timezone — never rely on the host's local timezone. A `no-restricted-imports` rule in the root `eslint.config.ts` enforces this by confining date-fns's `format`/`formatDistance`/`formatRelative` to that one module, as a file-scoped override rather than an inline `eslint-disable` comment, so the file keeps the rule's other restrictions.
- **Times are `Date`**, formatted and compared with date-fns; `dayjs` is gone (nothing lints against re-adding it - it simply is not a dependency). **Times held in config or any other shared state are ISO strings, not `Date`** — a `Date` is mutable and neither `Object.freeze` nor `Object.seal` protects it (its value is an internal slot, not a property), so handing one out lets a caller shift it for the whole process. `Dayjs` was immutable and made this safe for free; strings restore that. Construct a `Date` where it is compared or formatted. The migration was motivated by types: `dayjs()` accepted `null`/`undefined`, so a nullable time compiled fine and produced an Invalid Date whose every comparison returned `false` — a wrong answer rather than an error. date-fns rejects nullish input at compile time, which surfaced several genuinely nullable values that had been silently absorbed.
- No database migrations: events run on fresh, short-lived DBs, so enum/shape changes here need no migration or compatibility shim (see [root CLAUDE.md](../CLAUDE.md)).
