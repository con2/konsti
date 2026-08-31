# server/CLAUDE.md

Guidance for working in the `server/` workspace (Express 5 + MongoDB/Mongoose backend). See the [root CLAUDE.md](../CLAUDE.md) for the project overview, monorepo layout, and cross-cutting conventions, and [shared/CLAUDE.md](../shared/CLAUDE.md) for the types/config/utilities this workspace imports.

## Scripts

Run from the repo root as `yarn workspace server <script>` (or via the root shortcuts noted below). Everything runs through `tsx` — there is no compile step.

`find-unused-translation-keys` scans **`client/src`** for unused i18next keys - the detector lives in this workspace but checks the client, and is wired into the root `yarn lint`. `docker:db` starts the local MongoDB container and is called automatically by `start:dev`. The one-off dev scripts (`test-assign`, `verify-results`, `update-popularity`, `check-start-times`, `check-missing-konsti-program-type`, `remove-invalid-games`) live under `src/test/scripts/`. `simulate-lottery` lives there too but is the one that needs no database of its own - it starts an in-memory one; see "Replaying a past event's lotteries" below.

`generate-data`, `update-kompassi-data`, and `load-past-event-data` preload `server/.env.development` (via `DOTENV_CONFIG_PATH` + `-r dotenv/config`, like `start:dev`) and — like `start:dev`/`start:test` — also preload `src/utils/applyPortOffset.ts` (`--import`), which resolves the per-worktree `PORT_OFFSET` from the shared registry (`scripts/portOffset.ts`) so each worktree's scripts target that instance's own database. An explicit `PORT_OFFSET` (shell or `.env` file) wins over the automatic assignment; Node runs `--require` before `--import`, so dotenv-loaded values are visible to the preload. `generate-data` uses the env-var form instead of the trailing `dotenv_config_path=...` argv form on purpose — a trailing arg would break its commander `process.argv.length < 3` help check.

**The generators seed states the production code could itself have produced**, which for the lottery means asking the same predicates rather than reproducing the rules. `--eventLog` simulates a lottery and records it with `saveLotteryRanForStartTime`, so the sign-ups it writes belong to a start time that reads as decided — without the mark the next `saveProgramItems` passes those program items over for the lottery they already had. It therefore runs **before** `--directSignups`, which fills only the leftovers: a lottery program item takes first-come sign-ups only once its lottery is behind it. `--lotterySignups` picks its start times through `tooEarlyForLotterySignup` and groups them by the parent-resolved lottery time, so a batch counts as the one lottery it is.

## Directory Layout (`server/src`)

- **`index.ts`** — entry point (ESM). Does **not** import `utils/instrument.ts` directly; Sentry is initialized via the `--import=./src/utils/instrument.ts` Node preload in the `start` scripts (see Sentry note below).
- **`api/`** — route tables. `apiRoutes.ts` (the main router) and `sentryRoutes.ts` (separate router for the Sentry tunnel, mounted before `express.json()`).
- **`features/{feature}/`** — feature modules: `admin`, `assignment`, `direct-signup`, `health`, `kompassi-login`, `notifications`, `program-item`, `program-item-popularity`, `results`, `sentry-tunnel`, `serial`, `settings`, `statistics`, `user`. Each has controllers (HTTP), services (business logic), and Mongoose schemas/repositories.
- **`middleware/`** — `requireAuth.ts`, `validateRequest.ts` (exports both `validateBody` and `validateQuery`), `logApiCall.ts`, `cors.ts`, `wwwRedirect.ts`.
- **`db/`** — `mongodb.ts` (connection lifecycle) and `mongoosePlugins.ts` (global plugins).
- **`utils/`** — cross-cutting helpers: `server.ts` (Express app assembly), `logger.ts` (winston), `instrument.ts` (Sentry), `applyPortOffset.ts` (per-worktree `PORT_OFFSET` preload, see Scripts above), `cron.ts` (scheduled jobs), `notificationQueue.ts` (email queue), `jwt.ts`, `bcrypt.ts`, `authHeader.ts`, `zodUtils.ts`, etc.
- **`types/`** — server-only types (`assignmentTypes.ts`, `jwtTypes.ts`, `serialTypes.ts`, `userTypes.ts`, `resultTypes.ts`, `declarations/`). Domain models live in `shared/types/models/`.
- **`kompassi/`** — event-specific Kompassi program-item import logic (`ropecon/`, `tracon/`, etc.). Kompassi _login_ lives in `features/kompassi-login/`, not here.
- **`test/`** — `globalSetup.ts` + `setupTests.ts`, `mock-data/`, `utils/` (test helpers), `test-data-generation/`, `kompassi-mock-service/` (registered only in `development`), `test-settings/`, `scripts/`.

## Build & Run Model

- **Dev:** `tsx watch` re-runs `src/index.ts` on change; env from `.env.development` via `dotenv`.
- **Production:** the root multi-stage `Dockerfile` builds the client (`yarn workspace client build:$env`), copies `client/build` → **`server/front`** (served as static assets), installs production deps with `yarn workspaces focus --all --production`, and runs `dumb-init yarn start` — i.e. **`tsx src/index.ts` directly, no `tsc`/`dist` step**.
- The server serves the built SPA from `server/front/` and the API from the same Express app (port 5000).

## Environment & Config

- Two env vars drive configuration: **`NODE_ENV`** (`development` | `ci` | `staging` | `production` | `test`) and **`SETTINGS`** (selects the server config profile). Read config through `config.server()` / `config.event()` / `config.sentry()` from `shared/config` — see [shared/CLAUDE.md](../shared/CLAUDE.md).
- `.env.development` (local), `.env.test` (test runs), `.env.sample` (template — copy and fill Kompassi OIDC creds; never commit secrets).
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

Both tiers stay out of `production` and have a belt-and-braces guard inside the handler. The guard variable matters: k8s pods always run with `NODE_ENV=production` and only `SETTINGS` distinguishes staging from production, so the staging-exposed `postAddSerials` guards on `SETTINGS === "production"`, while the development/ci-only handlers guard on `NODE_ENV === "production"` (which correctly also blocks staging).

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

Local login (bcryptjs) and Kompassi OIDC (authorization code flow against `{KOMPASSI_BASE_URL}/oidc/authorize/` → `/oidc/token/` → `/oidc/userinfo/`; the `sub` claim is stored as `kompassiId`).

**`kompassiId` must only ever meet a fresh database.** It holds the OIDC `sub` as a **string**, where the pre-OIDC code stored the legacy `/api/v2/people/me` numeric `id`. Both halves of that change break matching against rows written by the older code: Mongo queries are type-strict, so `findOne({kompassiId: "12"})` does not match a stored `12`, and `UserSchemaDb` now rejects a numeric `kompassiId` on every read — which fails `findUser`/`findUserByKompassiId`/session restore for **all** users, not just Kompassi ones. (Kompassi's own docs also call `sub` a different ID space from the legacy Person id, though the two values coincide in practice.) The per-event DB lifecycle already guarantees this, but a mid-event deploy against a populated DB, or a restored older dump, would silently re-create every Kompassi account with a fresh serial. Reset the local dev DB after pulling this. JWTs are signed/verified in `server/src/utils/jwt.ts` (per-role secret keys); the `Authorization: Bearer <jwt>` header is parsed in `utils/authHeader.ts` and enforced by `requireAuth`. User roles: admin, helper, regular user (`UserGroup` in `shared/types/models/user.ts`). The client stores the JWT in localStorage — see [client/CLAUDE.md](../client/CLAUDE.md).

## Rate Limiting

There is **no application-level rate limiting**. This is intentional:

- Convention attendees connect via venue-shared NAT'd WiFi (hundreds of users behind one public IP). Per-IP rate limiting either throttles legitimate users or is set so high it does nothing against attackers.
- Per-username throttling on `/login` was rejected because it lets one attendee lock out another by spamming wrong passwords for that account.

## Assignment System

Two lottery algorithms: PADG (preference-based via `eventassigner-js`) and random (`eventassigner-random`), under `server/src/features/assignment/`. Assignment runs automatically on a cron schedule; admins can trigger manual runs as a backup. Users submit weighted preferences during sign-up windows defined per-event in `shared/config/`. The orchestrator (`run-assignment/`) cleans up invalid sign-ups before running (see below).

**The lottery for a start time runs once**, enforced at three scopes:

- Per program item, `runAssignment` filters out anything carrying `lotteryRanForStartTime` - the
  start time a program item was lotteried for, written by the assignment and left out of
  `saveProgramItems`' update object so a Kompassi import can't clear it, exactly like `popularity`.
  When every starting item is marked the run returns `ALREADY_LOTTERIED` without touching anything.
  The stored value is a time rather than a flag so `hasLotteryAlreadyRun` can tell a **rescheduled**
  item from one still sitting where it was lotteried, which is what the program item page and
  `storeLotterySignup` key on. It records each item's **own** start time at the moment of the run,
  not the run's `assignmentTime`: those differ for a batch, whose parent time reads the same before
  and after one of its items moves, so a parent-resolved mark could never detect a move at all.
- Per program item, `runAssignment` also skips anything that already holds sign-ups, and marks it
  anyway so cancelling them can't put it back. `partition` splits those only to log which way it
  broke: a lottery-placed sign-up means a run got past its critical write and stopped before
  marking it, a first-come one means the item has been taking direct sign-ups by another route.
  Both are skips rather than run-level failures, so one slipped program item costs its own lottery
  and not the whole hour's. `getPassedOverProgramItems` normally gets to the second case first
  (see below), leaving this as the backstop.
- Per run, `storeAssignment` refuses a run that misses the gap between lottery sign-up closing and
  direct sign-up opening, on either side (`lotterySignupStillOpen`, `directSignupAlreadyOpen`). It
  lives there rather than in `runAssignment` because only a manual run can be off the mark - the
  cron derives its start time from the current time - and because every item in a run shares a
  start time, making both verdicts properties of the run. Note this re-adds the guard reverted in
  July 2026; the reason for that revert was that the re-run logic was about to be reworked, which
  is what this is.

**The rules the lottery is built around are written down in
[`docs/en/lottery-design-rules.md`](../docs/en/lottery-design-rules.md)** - a group lands in one
program item or none, direct sign-ups are never deleted automatically without cause, a lottery win
overwrites a spot already held at that hour, holding a direct sign-up doesn't keep an attendee out of the
lottery, a start time is lotteried once, and a program item is empty when it is lotteried. Read
those before changing anything below; this section is how they are implemented, not why they hold.

**Write order is criticality order.** `saveResults` owns it: `saveUserSignupResults` saves the spots
(one `bulkWrite`, the only write anybody depends on) and then removes the sign-ups those spots
replaced, then `saveLotteryRanForStartTime` closes the start time, then the notifications and the
stored snapshot. Everything after the `bulkWrite` logs its failure instead of returning it — the
spots are safe by then, and aborting would leave a decided start time unmarked and its winners
unnotified. A run that returns an error therefore failed at or before the `bulkWrite` — and since
that is one update per program item, it may still have placed the attendees of the ones it reached,
which the next run skips rather than redoes.

**The removal comes after the write, and only for the spots that landed.** `removeReplacedSignups`
works from the final results rather than the proposed ones, so a sign-up is never given up for a
replacement that then doesn't land — leaving the attendee with neither, which rule 12 calls the
worst outcome available. It skips the program item they won, because the write puts their new spot
where their old entry was rather than beside it. A program item being lotteried holds no spots at
all (rule 7), so a winner is never already in one and that rewrite is defence in depth — it is also
why the write counts only the newcomers against `maxAttendance`: an attendee already in the program
item keeps their place either way, so charging them for it would drop somebody who fits.

**No spot keeps its holder out of a run**, whoever gave it to them, so nothing filters attendees
before the algorithm sees them. `getRandomAndPadgInput` expands each group and hands the whole lot
over; `getAttendeeGroups` makes individuals groups of one so the group stays the unit throughout.
`dropResultsThatDoNotFit` in `saveUserSignupResults` drops a whole group at a time for the same
reason.

Protecting a lottery-placed spot from being overwritten was built and removed. It only ever applied
to a program item rescheduled onto a slot its attendees had sign-ups for, where the attendee had
never ranked the two against each other - and it withdrew an entire group whenever one member still
held such a spot, since competing a member short would split the group.

Taking part also means hearing the outcome: an attendee the lottery doesn't place gets the usual "no
spot" message even while holding a sign-up of their own at that start time. That reads oddly at
first, but it is accurate - the lottery considered them and didn't place them - and for a group
member it is the only signal that their group missed out, since they entered through the creator's
sign-ups.

An attendee may hold a direct sign-up and a lottery sign-up for the same start time, in either
order: neither `storeLotterySignup` nor `storeDirectSignup` cancels the other. If the run places
them, the spot they win replaces the one they held; if not, what they signed up for themselves
stands. Both forms say so before they confirm — `LotterySignupForm` about the direct sign-up
they hold, `DirectSignupForm` about the lottery sign-ups they have at that start time whose lottery
is still ahead, since one kept as a record of a lottery that has run cannot take the spot away. Both
compare the items' **own** start times, because a win displaces spots at the hour the won program
item starts rather than the hour its batch was lotteried at. The lottery form still names only the
first spot it finds at that hour, which rule 11 records as a known gap.

One route is left open on purpose: rescheduling a program item someone holds a spot in onto a slot
they have lottery sign-ups for. `updateMovedProgramItems` cancels the moved item's own lottery
sign-ups and notifies **only while its lottery is still ahead**, and leaves the ones it landed on
alone - the attendee didn't cause the move, and re-adding a lottery sign-up is impossible once the
sign-up window has closed. Once the lottery has run, the moved item's own sign-ups stay too, as a
record of it. The run then treats that spot like any other.

One consequence worth knowing: because the lottery never revisits a start time, a program item left
below `minAttendance` by cancellations stays there, and lowering `maxAttendance` below the number of
attendees already in it leaves it over its new limit. Neither self-corrects, and re-running is not
the remedy - the ops answer to a lottery that went wrong, once its direct sign-up phase has opened,
is the admin message plus direct sign-up. The clock gate above is what holds admins to that.

**The assignment's event log is append-only** - see "an event log item is never deleted, and what it says never changes" in [`docs/en/lottery-design-rules.md`](../docs/en/lottery-design-rules.md). Nothing here removes or rewrites an item, and nothing needs to: `addAssignmentNotifications` runs after the spots are saved for a start time that is normally decided exactly once, so each attendee hears about it once. The de-duplication and follow-up notices that existed while re-runs did went with them. One case is left over: on the retry rule 6 permits, the winners are protected because the run reads their spots back off disk, but a rejection leaves no such trace, so everyone the first attempt turned down is told a second time. See "an event log item is never deleted" in [`docs/en/lottery-design-rules.md`](../docs/en/lottery-design-rules.md) for what closing it would take.

Two mechanics hold the append-only half. `addEventLogItems` and the `isSeen` update are the only writes that touch `eventLogItems` at all, so **an update that saves a whole user document must leave the field out** — `updateUsersByUsername` lists five fields for exactly this reason, and its callers hand it a `User` they read moments earlier. Writing that back would silently drop any item appended in between, with no error and nothing in the log. And **`$addToSet` is not a duplicate guard here**: each item carries its own `createdAt` and Mongoose gives every subdocument an `_id`, so it behaves as `$push`. Nothing depends on it de-duplicating (the retry above assumes it doesn't), but don't read it as protection.

**Assignment test organization** (`run-assignment/`): put generic, algorithm-independent behavior — start-time filtering, sign-up cleanup/preservation, result snapshots, error cases — in `runAssignment.test.ts`. The per-algorithm files (`runAssignmentPadg.test.ts`, `runAssignmentRandom.test.ts`, `runAssignmentRandomPadg.test.ts`) hold only cases specific to that algorithm. New generic cases go in `runAssignment.test.ts`.

The fixtures and both algorithms draw from randomness (faker, `n()`, and the PADG list shuffle, all through `Math.random`), so a test asserting a fixed result count must call `seedRandomness()` from `src/test/utils/` before `generateTestData`. It seeds faker too, which is why per-test database names come from `randomUUID()` rather than faker - seeded, every test in a file would otherwise draw the same name and share one database.

## Program Item Changes That Take It Out Of The Lottery

`saveProgramItems` calls `getPassedOverProgramItems` **before** its bulk write. A lottery program item that already holds direct sign-ups is not going to be lotteried (see "a program item is empty when it is lotteried" in [`docs/en/lottery-design-rules.md`](../docs/en/lottery-design-rules.md)), so `passedOverForLottery` is folded into that same `updateOne` — the item is never stored as a lottery item without the mark, so there is no window in which it can be offered as one. `lotteryRanForStartTime` is left alone here: no lottery ran, and the two are different facts. `removePassedOverLotterySignups` then cancels any lottery sign-ups it carries with `PROGRAM_ITEM_NO_LOTTERY_ANYMORE`, **unless their lottery has already run** (see "a lottery sign-up is never deleted once its lottery has run" in [`docs/en/lottery-design-rules.md`](../docs/en/lottery-design-rules.md)). In practice there is nothing to cancel either way: holding direct sign-ups is what passes a program item over, and an item that has those has its lottery behind it, so this is defence in depth rather than a path that normally fires. Any sign-up it does carry can only come from an earlier spell as a lottery program item, since the marked item never accepted one. Marking rather than re-reading the sign-up count is what keeps the decision after those sign-ups are cancelled; it only happens while `getDirectSignupPhaseStarted` is still false for the item, since one already offering direct sign-up on the schedule gains nothing from the mark. That line is drawn at direct sign-up opening rather than at the lottery closing on purpose, so an item that becomes a lottery one inside the phase gap is still marked and keeps its open sign-up instead of having it shut for the rest of the gap. Reached only through a program item becoming a lottery one after taking sign-ups as something else — direct sign-up for a lottery program item opens after its lottery, so it cannot happen the ordinary way. Such an item keeps direct sign-up open from that moment (rule 9), rather than closing it against the two-phase schedule it has just landed on.

## Program Item Cancellation Types

A program item can effectively "go away" in five distinct ways; each has different data-cleanup semantics:

1. **Cancelled** — `state: "cancelled"` in DB. Item stays visible (so users know it was cancelled).
2. **Deleted** — the program item document is removed from the DB entirely. All related records (lottery sign-ups, favorites, direct sign-ups, etc.) should also be removed.
3. **Sign-up type changed** — item stays in DB with `state: "accepted"`, but `signupType` is no longer `KONSTI` (e.g. moved to `OTHER`). No new Konsti sign-ups possible.
4. **Program type changed to non-lottery** — item stays in DB with `state: "accepted"` and `signupType: "konsti"`, but `programType` is no longer in `twoPhaseSignupProgramTypes` (e.g. changed from `TABLETOP_RPG` to `OTHER`). Lottery is no longer meaningful for this item; use `isLotterySignupProgramItem` to detect this state.
5. **Hidden** — the program item's ID is in `Settings.hiddenProgramItemIds`. Item stays in DB unchanged but disappears from every attendee-facing view, so a spot in one can no longer be seen or given up. Unlike the four above this is an admin settings change, not a programme import.

Cleanup rules (admin-import path, `notify: true`; hidden is the settings path, see below):

| Case               | Lottery sign-up                                            | Direct sign-up    | Favorite          |
| ------------------ | ---------------------------------------------------------- | ----------------- | ----------------- |
| Cancelled          | Preserve if lottery already ran, otherwise remove + notify | Remove + notify   | Keep              |
| Deleted            | Remove + notify                                            | Remove + notify   | Remove + notify   |
| SignupType change  | Preserve if lottery already ran, otherwise remove + notify | Remove + notify   | Keep              |
| ProgramType change | Preserve if lottery already ran, otherwise remove + notify | Keep (no notify)  | Keep              |
| Hidden             | Remove, no notify, no lottery-run gate                     | Remove, no notify | Remove, no notify |

**Hiding is the odd one out on both counts.** It runs from `removeHiddenProgramItemsFromUsers` (`server/src/features/settings/utils/`) on every `POST` to the hidden-items setting, not from `saveProgramItems`, and it is the only cleanup path that removes records without writing an event log item or queueing an email — see "a direct sign-up is never deleted automatically" in [`docs/en/lottery-design-rules.md`](../docs/en/lottery-design-rules.md), which records the silence as a known gap. It also removes lottery sign-ups without asking `getLotterySignupEnded`, which is the one place that does not hold the preservation rule the other four do. Unhiding restores nothing: the records are gone.

Lottery sign-up cleanup lives in `removeCancelledDeletedProgramItemsFromUsers` (`server/src/features/assignment/utils/removeInvalidProgramItemsFromUsers.ts`); preservation is gated on `getLotterySignupEnded`, which the move and pass-over cleanups ask too - see "a lottery sign-up is never deleted once its lottery has run" in [`docs/en/lottery-design-rules.md`](../docs/en/lottery-design-rules.md). **The window is never the only question asked**, because it is derived from the program item's **current** start time and a reschedule onto a later slot reopens a closed one: each removal asks `lotteryRanForProgramItem` beside it, over the **stored** program item, since the incoming Kompassi programme carries no marks. `removeOverlapLotterySignups` (the run's own cleanup, driven by `removeLotterySignupsStrategy`) asks the mark alone - it picks sign-ups by start time, so what it has to recognize is a program item some other run has already decided. `removePassedOverLotterySignups` needs neither addition: `getPassedOverProgramItems` has already excluded every item carrying a mark. A **deleted** program item is the one case that cannot be asked, since there is no start time left to derive the answer from, so its sign-ups always go. **Because those sign-ups are preserved, the assignment has to exclude cancelled program items itself** - `isAssignableProgramItem` in `prepareAssignmentParams` requires `State.ACCEPTED`, without which a re-run would place attendees into a program item that isn't happening. Direct sign-up cleanup lives in `handleCancelledDeletedProgramItems` (`server/src/features/program-item/programItemUtils.ts`); it does not touch direct sign-ups for programType-only changes because the item still exists and still uses Konsti sign-up (direct sign-up remains valid whether the lottery has run or not). The lottery-signup path deduplicates event log entries when a user has both a lottery and a direct sign-up for the same item, so there's no double notification.

Each case emits its own event log action so the user sees a case-specific message: **Cancelled** uses `PROGRAM_ITEM_CANCELLED`, **Deleted** uses `PROGRAM_ITEM_DELETED`, **SignupType change** uses `PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE`, and **ProgramType change** uses `PROGRAM_ITEM_NO_LOTTERY_ANYMORE` (enum in `shared/types/models/eventLog.ts`, rendered client-side by the matching `EventLogProgramItem*` components and `eventLogActions.*` locale keys). The lottery path picks the action via the `getCancellationAction` classifier; the direct-signup path routes each bucket through `notifyUsersWithDirectSignups` with the matching action.

Pre-assignment cleanup (`runAssignment.ts` → `notify: false`) calls the same function with the same preservation semantics; the `notify: false` flag only suppresses these cancellation event-log notifications. This path is a safety net — invalid sign-ups should already have been handled when the program items were updated.

When writing `signedToStartTime` for sign-ups, store the program item's own `startTime` — the hour the attendee turns up — for both lottery and direct sign-ups; the parent override is about lottery timing only, see [shared/CLAUDE.md](../shared/CLAUDE.md).

## Cross-Cutting Server Patterns

- **Logging:** winston logger in `server/src/utils/logger.ts` — human-readable in dev, JSON in production; error-level logs are also forwarded to Sentry (`winston-transport-sentry-node`). Console level is `info` by default; the `LOG_LEVEL` env var overrides it (`debug` enables debug logs, and the Playwright scripts set `warn` to hide per-request logs). Logging is mocked off in tests unless explicitly enabled in config. Log errors by passing the `Error` directly — `logger.error(new Error("context"))`, or wrap an underlying error as the cause — `logger.error(new Error("context", { cause: err }))`. **Do not use the old `logger.error("%s", new Error(...))` idiom**: the `%s` is unnecessary (the logger surfaces the Error to Sentry and renders the stack/cause itself) and stringifying the Error into the message produced a doubled `Error: Error:` prefix in Sentry.
- **Error handling:** the final Express error middleware (in `utils/server.ts`) logs and responds 500; a JSON body-parse guard handles malformed bodies as 400; `@sentry/node`'s express error handler captures exceptions. Prefer returning `Result` errors from services over throwing.
- **Sentry:** initialized in `utils/instrument.ts`; DSN/sample rate from `config.sentry()`. Under ESM, importing `instrument.ts` from `index.ts` is **not enough** to auto-instrument Express — by the time `Sentry.init()` runs, Express is already linked and can't be wrapped (you'd see `[Sentry] express is not instrumented`). The `start` / `start:dev` / `start:test` scripts therefore preload it with Node's `--import=./src/utils/instrument.ts` flag (via `tsx`), which registers the OpenTelemetry import hooks before the app module graph loads. The `release` is read from `process.env.APP_VERSION` (set to the git SHA in the runner image, matching the release `deploy.yml` creates in `konsti-backend-{env}`); it is the Sentry release name only and is **not** part of the settings response, which reports `appBuildTime` — the image's build time, and the sole deploy identifier the client sees; it's `undefined` locally. Unlike the frontend maps/release — which upload during the image **build** — the backend release is created **after** a successful `deploy` (the `backend-sentry-release` job, `needs: deploy`), so a failed deploy creates no backend release.
- **Cron jobs:** scheduled in `utils/cron.ts` using `croner` (e.g. auto-updating program items from Kompassi and auto-running assignment), toggled per-environment via server config; guards prevent a stale server instance from running a job. The assignment job passes `assignmentTime: null`, so **which** start time it lotteries comes from `getDynamicStartTime` (`getTimeNow()` + `directSignupPhaseStart`) and therefore honours the mocked clock, while **when** it fires comes from croner and the real one. The two clocks are what `cron.test.ts` and `cronEventProgram.test.ts` split between them. `cron.test.ts` calls the job handlers directly under `vi.setSystemTime`, covering the instance check, the lock and job registration. `cronEventProgram.test.ts` registers the real jobs on a one-second schedule and must **not** freeze the clock, because a frozen date leaves croner waiting out the delay to the next real tick; it runs both jobs against the live event config and the event's own Kompassi dump (`useLocalProgramFile`), so a parent hour or a slug that stopped lining up with its sub-sessions fails a test rather than an event. Each of its tests registers only the job it drives, since the other ticking every second alongside would re-import the program mid-lottery.

  The two jobs' last-run times are not the same kind of marker, which matters when waiting on one: `assignmentLastRun` is written after the run, but `programUpdateLastRun` **is** the update's concurrency guard (a tick within 30 seconds of the last is refused as one still in flight) and so is written before the import starts. Wait on the update's completion log, not its last-run time.

- **Email notifications:** queued through `utils/notificationQueue.ts` (a `fastq` queue) and sent via `nodemailer`.
- **Security & static serving:** `helmet` for headers; the SPA in `server/front/` is served with `express-static-gzip` (brotli/gzip). Cache policy: files served from the bundle's `assets/` directory get a one-year immutable `Cache-Control`, everything else (`index.html`, `robots.txt`, the SPA fallback) gets `no-cache`. Clients therefore revalidate the HTML on every load but keep old chunks cached across deploys, so a stale page still finds its matching chunks instead of fetching deleted files. The rule keys on the directory rather than the shape of the filename because a name alone is ambiguous - an ordinary hyphenated name is indistinguishable from a hashed one - and the directory is matched relative to the served root, so an `assets` directory somewhere above it can't widen the rule.
- **Mongoose conventions:** global plugins in `db/mongoosePlugins.ts` (lean getters/virtuals via `mongoose-lean-getters`/`mongoose-lean-virtuals`, `toJSON` transforms that strip `_id`/`__v`). Mongoose applies global plugins at model-compile time, so **every file calling `mongoose.model()` imports `server/db/mongoosePlugins` for its side effect as its first import** — a model compiled before that module runs silently loses the plugins, and DB reads/writes then fail in ways that look unrelated. Add that import to any new schema file rather than relying on some other module having pulled it in first. Connection lifecycle in `db/mongodb.ts`. Dates are `Date`, handled with date-fns (see [shared/CLAUDE.md](../shared/CLAUDE.md)).

  Two update-shape rules worth knowing. Both raise a real error, but every repository wraps its query in `try`/`catch` and returns an error `Result`, so what you actually observe is a write that didn't happen and one log line — not a stack trace:

  - **A `$pull` whose condition uses query operators needs `{ runValidators: false }`.** `mongoose.set("runValidators", true)` is global, and update validators read the operator object (`{$gte, $lt}`) as a document to validate, rejecting it for the fields it doesn't contain. A `$pull` only removes array entries, so there is nothing to validate.
  - **Aggregation pipeline updates need `{ updatePipeline: true }` outside `bulkWrite`.** `bulkWrite` accepts an array `update` as a pipeline natively; `findOneAndUpdate`/`updateMany` throw `Cannot pass an array to query updates unless the 'updatePipeline' option is set` without it.

  Inside a pipeline, **interpolated values need `$literal`**. A bare string is an expression: a username like `$admin` is read as a field path and matches nothing, where the same value in query language (`$pull`, `find`) is a literal. Usernames are validated for length only, so this is reachable input, not a hypothetical.

- **Sign-up `count` is derived from `userSignups`, and the attendance limit is enforced by the write.** `count` gates the direct sign-up endpoint (`count: { $lt: maxAttendance }`), so drift makes a program item report itself full to real users for the rest of the event. The removal paths and the bulk assignment write recompute it in the same atomic pipeline (`$set: { count: { $size: "$userSignups" } }`) rather than adjusting it by hand — a `$pull` can remove more than one entry, so an `$inc: -1` beside it would be wrong with nothing to correct it. `saveDirectSignup`, the single user-facing sign-up, is the exception: its filter already proves the user is absent and the program item has room, so its `$inc: { count: 1 }` is exact. The assignment write also caps the array with `$slice` at `maxAttendance`, because its capacity figure comes from an earlier round-trip and a first-come-first-served sign-up can land in between; it drops the attendees it is writing out of the array first, so each of them ends up with one entry rather than a second one beside their old spot.

## Database

MongoDB with Mongoose. Tests use `mongodb-memory-server` for an in-memory DB. Docker Compose config in `docker/`; the local dev DB container starts via `yarn workspace server docker:db` (port 27017).

**Lifecycle:** each convention runs its own instance for the duration of the event only. After the event the DB is dumped to `server/src/features/statistics/datafiles/` and the instance is torn down. Because there is no long-lived production DB and no cross-event continuity, schema or enum-value changes don't need migration files — just change the code and let the next event start with a fresh DB. Do not add migration scripts, startup migration hooks, or backwards-compatibility shims.

**Reset your local dev DB after adding a required field** (`docker:db` Mongo, `konsti-<offset>`, unlike per-event DBs it persists across schema changes). A field added to a `*SchemaDb` zod schema is validated on **read**, but a Mongoose `default` only fills it on **new-document creation** — so a row written before the field existed fails that read. Example: adding `Settings.adminMessage` makes `GET /api/settings` 500 against an old settings row (and the client hangs on the loading screen because bootstrap can't fetch settings). This needs no migration (consistent with the fresh-DB policy) — reset the row: `populateDb({ clean: true })` in tests / e2e, the `POST /api/clear-db` dev endpoint, or drop the dev database.

## Past-event Datafiles

Sanitized DB dumps from every event live under `server/src/features/statistics/datafiles/{event}/{year}/`. They've been normalized so all years share one schema (Ropecon 2025 is the canonical reference). Full schema in [`docs/en/datafiles-guide.md`](../docs/en/datafiles-guide.md). Aggregated stats live under [`docs/statistics/`](../docs/statistics/). Past-event config files in [`shared/config/past-events/`](../shared/config/past-events/) are typed `Partial<EventConfig>`; configs for 2017–2022 + Hitpoint 2019 were reconstructed from the dumps and carry a notice header.

### Replaying a past event's lotteries

`yarn workspace server simulate-lottery` (root alias `yarn simulate-lottery`) loads a dump into a `mongodb-memory-server` instance it starts itself and replays every lottery the event recorded, in order, through the real `runAssignment` — so each run's spots, marks and event log feed the next, which is what the first-time bonus and the once-per-start-time rules turn on. It exists for two things: catching regressions against a committed baseline (`--check` exits non-zero on drift, `--update-baseline` rewrites it), and measuring the lottery on real data (placement rate, preference split, capacity fill, time per run, and the delta against the event's own `results.json`). Defaults to `ropecon/2025` and the event's own algorithm; `--event all`, `--algorithm all`. Code and baselines under `src/test/scripts/simulate-lottery/`.

Three things about it are worth knowing before trusting a number:

- **The lottery shares `Math.random` with the MongoDB driver, and that is what the determinism machinery is working around.** Two consequences. `seedMathRandom` is called before **each run** rather than once per replay, and resets one installed function's state rather than assigning a new one, since the assignment libraries capture `Math.random` when they load. And **each event/algorithm pair replays in its own process** — `--event all` and `--algorithm all` fan out with `spawnSync` — because how much the driver has drawn by the time a run starts depends on everything the process did before it, so a second replay in the same process starts its first run on a shifted stream. What survives is a real limit: a change to the **load path** (how many documents are written, or how big they are) can shift the first run of a replay even though the lottery is untouched, so a baseline has to be regenerated after one. Repeated runs of unchanged code are exact.
- **The input is the dump's final state, which is not what each run saw.** Lottery sign-ups removed after a run cannot be reconstructed — the report prints how many preference sets are missing a middle choice (311 of ~4900 for Ropecon 2025). Direct sign-ups are loaded only where they cannot have come from a lottery phase, since direct sign-up for a lottery program item opens after its lottery and feeding one back in would pass the item over. Group membership is final-state too. `kompassiId` and `email` are loaded empty: both are redacted to one literal in every dump, which the unique index and the address schema reject, and neither reaches the lottery.
- **A program item over its own `maxAttendance` is loaded in full, and the write is told so.** An organiser lowering the limit on an item that has already filled leaves it over the new one, and nothing puts those attendees back out — Ropecon 2025 has three such items and Ropecon 2024 one. The loader raises `maxAttendance` to the number actually held, for the copy of the programme it hands `saveDirectSignups` and nowhere else, because the write otherwise caps what it appends and would throw away spots the event really seated. That matters beyond tidiness: a spot in a lottery program item spends its holder's first-time bonus, so a discarded one hands the bonus back. `saveDirectSignups` reporting any dropped sign-up after that is an anomaly the report flags, and the run's own drop alarm keeps meaning what it means for the assignment.
- **A past config is `Partial<EventConfig>`, so absent keys fall through to the current event's.** The lottery-relevant ones are listed and reported; `startTimesByParentIds`, `preConventionWeekSignupStartTime` and `directSignupAlwaysOpenIds` are neutralized instead, because they name program items and the current event's values would match a past programme only by accident.
- **A large "vs history" gap is usually the input, and the two Tracon events are the worked examples.** Both lotteried their flea market in two or three big runs, and they fall short for different reasons, so read the per-run figures in the baseline rather than the event total. **Tracon 2024** (-1540) carries no `startTimesByParentIds`, so a run that really covered thirteen half-hour items reaches only the one starting at the run's own hour - 130 spots against the 947 it placed. Its `results.json` hides this, because that era stored the parent-resolved time on the win, so every win reads as the run's hour rather than the item's; and its dump predates `parentId`, so there is no parent to key a map on even if one were added. **Tracon 2025** (-321) batches correctly - its first run replays exactly, 600 of 600 - and loses the next two to the sign-up removal being applied **twice, for two different sets of winners**. The dump already carries the real event's removals, so it holds 501 entrants for the second run rather than the pool the real one started from; the replay then removes its own run-one winners' sign-ups on top, and those are a different 600 people, leaving 380. What survives is roughly whoever won in neither the real event nor the replay. This is a property of every replay, but its size tracks the strategy: `ALL_UPCOMING` takes every later lottery, where Ropecon's `OVERLAP` only takes the clashes at one hour, which is why Ropecon 2025 sits at -34 on far more runs.
- **An event whose programme uses a retired program type is skipped with a reason**, not coerced: whether the lottery takes an item turns on its program type. Tracon Hitpoint 2019's `freeformRPG` is the current case. Retired values in the purely descriptive fields (tags, genres, styles, age groups, languages, accessibility values) are dropped instead, since the lottery reads none of them.

Non-obvious invariants when analysing the dumps:

- **Sign-up priority semantics** (`direct-signups.json` `userSignups[].priority`, `results.json` `assignmentSignup.priority`): `0` = first-come-first-served direct sign-up; `1`/`2`/`3` = lottery win at that preference. 2017–2019 events have only `1`/`2`/`3` (lottery-only era); 2021 Ropecon has only `0` (remote / COVID, direct sign-up only); 2022+ events mix both.
- **Group creator identification**: a user is the group creator iff `user.isGroupCreator === true` (a creator's `groupCode` is the group's own code). Regular members have `isGroupCreator: false`. In 2018–2023 dumps the `groupCode` happens to equal the creator's `serial`; from 2024 onward it's a UUID-style string.
- **`kompassiId` values**: always a string — `""` means registration-code user, `"<redacted>"` means Kompassi-OIDC user. The split only exists in events with `loginProvider: "local+kompassi"` (Ropecon 2025+); single-method events have one value across all rows. This matches the live DB, which stores the OIDC `sub` claim or `""`.
- **`popularity` scale history**: Ropecon 2025 introduced the 5-bucket enum (`notSet`/`low`/`medium`/`high`/`veryHigh`/`extreme`). Earlier dumps used a numeric scale that only encoded 3 buckets (`low` = under min attendance, `medium` = between, `high` = at max), so older normalized dumps never have `veryHigh` or `extreme`.
- **`lotterySignups[]` schema** (in `users.json`): `{programItemId, priority, signedToStartTime}` — no `message` field. Direct-signup `userSignups[]` does include `message`.
- **Algorithm naming history**: `algorithm` field is canonicalized — `Opa` was the older name for `padg`, `Group` was the older name for `random`. 2017 used `hungarian` (no longer in the codebase enum).

## Testing

Vitest with `mongodb-memory-server`. `src/test/globalSetup.ts` spins up the in-memory Mongo (port `47233`); `src/test/setupTests.ts` mocks the logger, stubs the event config to a fixed test time, and exposes the connection string as `globalThis.__MONGO_URI__`. Mock fixtures live in `src/test/mock-data/`; shared fixtures like `testProgramItem` come from `shared/tests/`.

**Prefer controller (integration) tests for cross-cutting behavior.** Whenever a behavior is observable through an endpoint — auth/role gating, request validation, concurrency guards, or the full request→service→DB effect — test it in the feature's `*Controller.test.ts` via `supertest` so it exercises the whole HTTP→service→DB path, rather than calling the service function directly. Reserve narrower unit tests for logic that isn't reachable (or is awkward to drive) through the endpoint.

**Controller (integration) tests** drive the real Express app with `supertest`. The standard shape:

```ts
let server: Server;
beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: randomUUID(), // unique DB per test avoids cross-test pollution
  });
});
afterEach(async () => await closeServer(server));

// Authenticate by minting a JWT for the required role
const response = await request(server)
  .post(ApiEndpoint.X)
  .send(body)
  .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "username")}`);
```

**Tests that don't start a server connect with `db.connectToDb(globalThis.__MONGO_URI__, randomUUID())`, not a bare `mongoose.connect`.** Mongoose builds a model's indexes only once per process, so a plain connect leaves every database after the first without them — and each test gets its own. The unique keys would then be missing exactly where tests seed data, so a test could insert duplicate users or a second settings document that production would reject. `startServer` already routes through the same helper, so controller tests need nothing extra.

**Never use Mongoose Models directly in tests** — always seed and read DB state through the feature's repository functions (`saveUser`/`findUser`, `findOrCreateSettings`, `setAssignmentLastRun`, etc.). When a repository has no helper for the exact state you need, prefer an existing function (e.g. `findOrCreateSettings` creates a default row) or control inputs another way (e.g. mock the clock with `vi.setSystemTime`) instead of reaching for the Model — this keeps tests decoupled from the schema and exercises the same code paths as production. Unwrap `Result` values via `unsafelyUnwrap` from `src/test/utils/` rather than reintroducing production unwrap helpers. Cast `response.body` to the expected shape and assert directly — do **not** wrap `expect` in conditionals (`vitest/no-conditional-expect` forbids it). Avoid asserting on real email/network side effects; they aren't available in unit runs.
