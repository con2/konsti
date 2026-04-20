# Terminology

Glossary of Konsti domain terms. Use this as the canonical source when naming things in code, docs, and UI copy. When several words could describe the same thing, prefer the **bolded canonical** name.

The "signup" and "lottery/assignment" areas are the most overloaded — see [Conflicts and footguns](#conflicts-and-footguns) at the bottom before coining new names.

## User and auth

| Term                 | Definition                                                                                                                                                                                                                                 | Where                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| **User**             | Registered account. Holds credentials, serial, group codes, signups, favorites, event log, and email preferences                                                                                                                           | `shared/types/models/user.ts`         |
| **UserGroup**        | Role enum: `USER`, `ADMIN`, `HELP`. Controls access to admin/helper views                                                                                                                                                                  | `user.ts`                             |
| **Admin**            | Full-privilege operator. Runs assignment, hides program items, edits settings                                                                                                                                                              | `server/src/features/admin/`          |
| **Helper**           | Limited operator (`UserGroup.HELP`). Looks up users by serial and resets passwords. UI always says "Helper", never "Help"                                                                                                                  | `client/src/views/helper/`            |
| **Serial**           | Unique short code attached to a user. Used at registration (when `requireRegistrationCode` is on) and for helper lookups. UI surfaces this as **"Registration code"** or **"User code"** — all three refer to the same `User.serial` field | `server/src/features/serial/`         |
| **JWT**              | Auth token stored in localStorage. Separate secrets per role (user/admin/helper)                                                                                                                                                           | `serverConfig.ts`                     |
| **Kompassi account** | External identity from Kompassi OAuth. Linked via `kompassiId`; `kompassiUsernameAccepted` tracks the username-claim flow                                                                                                                  | `server/src/features/kompassi-login/` |
| **LoginProvider**    | Allowed login flow: `LOCAL`, `KOMPASSI`, `LOCAL_KOMPASSI`                                                                                                                                                                                  | `shared/config/eventConfigTypes.ts`   |

## Program items

| Term                                   | Definition                                                                                                                                | Where                                              |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Program item**                       | The unit users sign up for. Imported from Kompassi. Canonical term — do not say "game", "event", or "program" in code                     | `shared/types/models/programItem.ts`               |
| **programItemId**                      | Stable identifier from Kompassi                                                                                                           | `ProgramItem`                                      |
| **parentId**                           | Optional link grouping child items to a parent (e.g. sub-sessions of a longer program)                                                    | `ProgramItem`                                      |
| **ProgramType**                        | Primary category: `tabletopRPG`, `larp`, `tournament`, `workshop`, `experiencePoint`, `other`, `roundtableDiscussion`, `fleaMarket`       | `ProgramType` enum                                 |
| **State**                              | `ACCEPTED` or `CANCELLED`. Cancelled items remain visible so users can see they were cancelled                                            | `State` enum                                       |
| **Cancelled**                          | DB item with `state=CANCELLED`. Stays visible                                                                                             | CLAUDE.md                                          |
| **Deleted**                            | Program item document removed from DB entirely. Cascades to related signups and favorites                                                 | CLAUDE.md                                          |
| **Hidden program item**                | Admin-hidden item, not shown to users. Tracked in `Settings.hiddenProgramItemIds`                                                         | `/api/hidden`                                      |
| **Ignored program item**               | Kompassi item excluded from import entirely via `ignoreProgramItemsIds`. Contrast with `noKonstiSignupIds` below                          | `eventConfig.ts`                                   |
| **Favorite**                           | User-flagged "watch this" item. Not a signup                                                                                              | `/api/favorite`                                    |
| **Genre / Gamestyle / Language / Tag** | Taxonomic enums on program items                                                                                                          | `programItem.ts`                                   |
| **InclusivityValue**                   | Accessibility metadata flags (flashing lights, dark lighting, long texts, etc.). Stored on `ProgramItem.accessibilityValues`              | `programItem.ts`                                   |
| **Revolving door**                     | Item users can drop in and out of freely when there is space                                                                              | `ProgramItem.revolvingDoor`, `enableRevolvingDoor` |
| **Entry fee** / material fee           | Free-text fee (e.g. workshop material fee)                                                                                                | `ProgramItem.entryFee`                             |
| **Entry condition**                    | Required checkbox (e.g. K16/K18 age confirmation) shown before signup                                                                     | `EntryConditionText`                               |
| **Content warnings**                   | Free-text field                                                                                                                           | `ProgramItem.contentWarnings`                      |
| **Popularity**                         | Derived metric (`LOW`, `MEDIUM`, `HIGH`, `VERY_HIGH`, `EXTREME`, `NULL`) from favorites and lottery signups vs capacity                   | `Popularity` enum, `program-item-popularity/`      |
| **minAttendance / maxAttendance**      | Capacity bounds for the program item                                                                                                      | `ProgramItem`                                      |
| **Spot**                               | A single attendee slot in a program item. User-facing word for one unit of capacity (`maxAttendance` = total number of spots)             | i18n copy                                          |
| **Attendee**                           | Person assigned or signed up to an item. Also rendered as "player" (RPG/LARP) or "participant" (other) in i18n depending on `ProgramType` | i18n `attendeeType.*`                              |

## Signups

The word "signup" is overloaded — see [Conflicts and footguns](#conflicts-and-footguns). Five distinct meanings to keep straight:

1. **SignupStrategy** (per-item enum): `DIRECT` or `LOTTERY`. Field on `ProgramItem`; optional — falls back to event-level `EventSignupStrategy`.
2. **EventSignupStrategy** (event-wide enum): `DIRECT`, `LOTTERY`, or `LOTTERY_AND_DIRECT`. Lives in `Settings`.
3. **SignupType** (where signup happens): `KONSTI`, `OTHER`, `NOT_REQUIRED`, `EXPERIENCE_POINT`, `ROPE_LARP_DESK`, `GAMEPOINT`. Only `KONSTI` means Konsti handles it.
4. **Signup (noun)** — the user-side object the user has submitted. Two shapes: `LotterySignup` and `DirectSignup`.
5. **Sign up (verb)** — the user action. UI copy: "Sign up".

| Term                                              | Definition                                                                                                                                                          | Where                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Konsti signup**                                 | Signup handled by this app. Happens only when `SignupType = KONSTI`                                                                                                 | —                                                              |
| **Lottery signup** (aka _two-phase signup_)       | Weighted preference submitted before the lottery runs. Stores `programItemId`, `priority`, `signedToStartTime`                                                      | `user.ts:LotterySignup`, `/api/lottery-signup`                 |
| **Direct signup** (aka _first-come-first-served_) | Immediate seat-taking signup with optional message. Prose/README says "first-come"; code always says `directSignup`                                                 | `user.ts:DirectSignup`, `/api/direct-signup`                   |
| **Priority**                                      | Lottery preference rank (1..3). `DIRECT_SIGNUP_PRIORITY = 0` is the magic constant marking a direct signup                                                          | `shared/constants/signups.ts`                                  |
| **signedToStartTime**                             | Start time stored on a signup. **Invariant**: lottery signups store the item's _own_ `startTime`; direct signups store the _parent-resolved_ time. See CLAUDE.md    | `user.ts`, `signupTimes.ts`                                    |
| **Signup question**                               | Admin-defined per-item question (text or select). May be `private` (visible only to admins)                                                                         | `settings.ts`, `/api/signup-question`                          |
| **Signup message**                                | User's answer to a signup question or free-text note. Max 140 chars                                                                                                 | `signupMessage.ts`                                             |
| **Tournament signup question**                    | Reusable signup question auto-applied to all tournament items                                                                                                       | `eventConfig.ts:tournamentSignupQuestion`                      |
| **Two-phase signup**                              | Flow where lottery runs first, then leftover seats go to direct signup. Controlled by `twoPhaseSignupProgramTypes`. `isLotterySignupProgramItem` detects this state | `eventConfig.ts`, `shared/utils/isLotterySignupProgramItem.ts` |
| **Rolling direct signup**                         | Direct signup opens in a rolling window (N hours before each item's `startTime`). Governed by `rollingDirectSignupProgramTypes`                                     | `signupTimes.ts:getRollingDirectSignupStartTime`               |
| **Signup always open**                            | Items whose direct signup opens at event start and stays open. Listed in `directSignupAlwaysOpenIds`                                                                | `signupTimes.ts`                                               |
| **noKonstiSignup**                                | Program item imported but not signup-able via Konsti (`noKonstiSignupIds`). Different from _ignored_ (not imported at all)                                          | `eventConfig.ts`                                               |

## Assignment and lottery

| Term                              | Definition                                                                                                                                              | Where                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Assignment**                    | Server-side noun for the allocation step — one execution of an algorithm over submitted lottery signups. Also the DB collection and feature folder name | `server/src/features/assignment/`                  |
| **Lottery**                       | User-facing noun for the two-phase signup process as a whole. Not a synonym for "assignment" in code                                                    | i18n `lotterySignup*`                              |
| **Assignment run**                | One invocation of the algorithm for a given `assignmentTime`                                                                                            | `runAssignment.ts`                                 |
| **AssignmentAlgorithm**           | `PADG`, `RANDOM`, or `RANDOM_PADG`                                                                                                                      | `eventConfigTypes.ts`                              |
| **PADG**                          | Preference-based algorithm from `eventassigner-js`                                                                                                      | `assignment/padg/`                                 |
| **Random**                        | Randomized algorithm from `eventassigner-random`                                                                                                        | `assignment/random/`                               |
| **RANDOM_PADG**                   | Run both algorithms, keep the better result                                                                                                             | `runAssignmentRandomPadg.test.ts`                  |
| **First signup bonus**            | Extra weight when a user (or group) has no prior assignments or has previously lost lotteries                                                           | `getAssignmentBonus.ts`                            |
| **Lottery signup phase / window** | Interval between `getLotterySignupStartTime` and `getLotterySignupEndTime`                                                                              | `signupTimes.ts`                                   |
| **Phase gap**                     | Minutes between lottery close and direct signup open. Gives users time to see results before re-signing                                                 | `eventConfig.ts:phaseGap`                          |
| **Direct signup phase**           | Interval starting `directSignupPhaseStart` minutes before the program item's `startTime`                                                                | `eventConfig.ts`, `signupTimes.ts`                 |
| **preSignupStart**                | Minutes before `startTime` that lottery opens                                                                                                           | `eventConfig.ts`                                   |
| **Fixed lottery signup time**     | Override to open all lottery signups at a single timestamp                                                                                              | `eventConfig.ts:fixedLotterySignupTime`            |
| **Assignment result**             | Output: user assigned to a program item                                                                                                                 | `shared/types/models/result.ts`                    |
| **Auto-assign**                   | Cron-triggered periodic assignment                                                                                                                      | `autoAssignAttendeesEnabled`, `autoAssignInterval` |
| **Admission ticket**              | Post-assignment confirmation view for attendees                                                                                                         | `client/src/views/admission-ticket/`               |

## Groups

| Term                 | Definition                                                                              | Where                           |
| -------------------- | --------------------------------------------------------------------------------------- | ------------------------------- |
| **Group**            | Multi-user lottery bloc. Creator submits one set of lottery preferences for all members | `shared/types/models/groups.ts` |
| **Group creator**    | User who created the group. Only one who can submit lottery signups or close the group  | —                               |
| **Group member**     | Other users in the group. Signups are inherited from the creator                        | —                               |
| **groupCode**        | Shared code used to join a group                                                        | `User.groupCode`                |
| **groupCreatorCode** | Private code proving creator role. Do not confuse with `groupCode`                      | `User.groupCreatorCode`         |
| **Close group**      | Creator-only action that disbands all members                                           | `/api/close-group`              |

## Events and config

"Event" always means a convention (Ropecon 2026, Tracon, Hitpoint, Solmukohta) — never a single program item.

| Term                          | Definition                                                                                                                                       | Where                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **Event**                     | A convention instance                                                                                                                            | `EventName` enum                  |
| **EventConfig**               | Per-event static config: signup strategy, algorithm, program types, windows, overrides                                                           | `shared/config/eventConfig.ts`    |
| **Settings**                  | Runtime-mutable admin settings (distinct from static `EventConfig`): hidden program item IDs, `appOpen`, current signup strategy, login provider | `shared/types/models/settings.ts` |
| **activeProgramTypes**        | Program types enabled for the current event                                                                                                      | `EventConfig`                     |
| **directSignupWindows**       | Per-program-type time windows within which items use the window start as their signup-open time                                                  | `EventConfig`                     |
| **startTimesByParentIds**     | Map overriding the effective start time for items sharing a `parentId`. Batches multiple sub-sessions into one lottery run. See CLAUDE.md        | `EventConfig`                     |
| **customDetailsProgramItems** | Per-id overrides for tags and languages applied at import                                                                                        | `EventConfig`                     |
| **requireRegistrationCode**   | If true, registration requires a `serial`                                                                                                        | `EventConfig`                     |
| **defaultSignupType**         | `SignupType` applied when Kompassi does not provide one                                                                                          | `EventConfig`                     |
| **appOpen**                   | Admin kill-switch for login                                                                                                                      | `Settings`                        |
| **Test time**                 | Debug feature letting admin freeze `timeNow`. Controlled by `serverConfig.useTestTime`; UI labels it "Active time"                               | `getTimeNow.ts`                   |

## Time and windows

Helpers in `shared/utils/signupTimes.ts`. Always prefer these over inlining parent-start-time resolution.

| Helper                                      | Purpose                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| **getProgramItemStartTime**                 | Returns `parent override ?? item.startTime`. Canonical way to resolve effective start |
| **getLotterySignupStartTime / EndTime**     | Lottery window bounds (parent-resolved)                                               |
| **getDirectSignupStartTime / EndTime**      | Direct signup window bounds. Respects two-phase vs rolling vs windowed                |
| **getRollingDirectSignupStartTime**         | Rolling-window start for `rollingDirectSignupProgramTypes`                            |
| **getLotterySignupNotStarted / InProgress** | State predicates for the lottery window                                               |
| **getPhaseGapInProgress**                   | True during the gap between lottery close and direct open                             |
| **getDirectSignupInProgress / Ended**       | State predicates for direct signup                                                    |

## Notifications and event log

| Term                         | Definition                                                                       | Where                                |
| ---------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| **Event log**                | Per-user notification feed. UI label: "Notifications"                            | `shared/types/models/eventLog.ts`    |
| **EventLogAction**           | `NEW_ASSIGNMENT`, `NO_ASSIGNMENT`, `PROGRAM_ITEM_CANCELED`, `PROGRAM_ITEM_MOVED` | `eventLog.ts`                        |
| **Email notification**       | Optional email sent on assignment events                                         | `server/src/features/notifications/` |
| **EmailNotificationTrigger** | `NONE`, `ACCEPTED`, `REJECTED`, `BOTH`                                           | `shared/types/emailNotification.ts`  |

## Admin and results

| Term                       | Definition                                       | Where                               |
| -------------------------- | ------------------------------------------------ | ----------------------------------- |
| **Admin view**             | Admin control panel                              | `client/src/views/admin/`           |
| **Assignment results**     | Persisted results keyed by `assignmentTime`      | `server/src/features/results/`      |
| **Program update**         | Re-fetching program items from Kompassi          | `autoUpdateProgramEnabled`          |
| **Populate DB / Clear DB** | Dev-only endpoints to seed or truncate fixtures  | `/api/populate-db`, `/api/clear-db` |
| **Statistics**             | Offline data-analysis scripts over real DB dumps | `server/src/features/statistics/`   |

## External integrations

| Term                  | Definition                                                                              | Where                                |
| --------------------- | --------------------------------------------------------------------------------------- | ------------------------------------ |
| **Kompassi**          | Finnish convention platform. Source of program items and the OAuth provider             | `server/src/kompassi/`               |
| **Sentry tunnel**     | Proxy endpoint so client Sentry events route through the server (ad-blocker workaround) | `server/src/features/sentry-tunnel/` |
| **Program guide URL** | External link to the full program, including items not handled by Konsti                | `eventConfig.ts:programGuideUrl`     |

## Conflicts and footguns

These pairs or groups of terms are easy to conflate. Read carefully before naming new fields or writing docs.

1. **Three "signup" enums** on the same codebase:
   - `SignupStrategy` (per-item: `DIRECT | LOTTERY`)
   - `EventSignupStrategy` (event-wide: `DIRECT | LOTTERY | LOTTERY_AND_DIRECT`)
   - `SignupType` (where signup happens: `KONSTI | OTHER | NOT_REQUIRED | EXPERIENCE_POINT | ROPE_LARP_DESK | GAMEPOINT`)

   Plus the signup-noun (`LotterySignup` / `DirectSignup`) and the signup-verb in UI. Always qualify which one you mean.

2. **Lottery vs assignment vs PADG**. "Lottery" is user-facing for the whole two-phase signup. "Assignment" is the server-side allocation step. "PADG" and "Random" are specific algorithms that run inside an assignment. `RANDOM_PADG` runs both and picks the best. Do not equate "lottery" with "PADG".

3. **Program item vs game vs event**. Canonical term is **program item**. i18n occasionally renders it as "game" (for RPGs) or "program", but code should always say `programItem`. "Event" is reserved for the convention.

4. **Direct signup vs first-come-first-served**. Same thing. Code says `directSignup`; prose and README say "first-come-first-served". Prefer "direct signup" in new docs.

5. **Serial vs registration code vs user code**. DB field is `User.serial`. UI calls it "Registration code" (user-facing) and "User code" (helper-facing). One concept, three names.

6. **groupCode vs groupCreatorCode**. The former is the shared join code; the latter is a private token proving creator authority. Not interchangeable.

7. **SignupType.OTHER vs ProgramType.OTHER**. `SignupType.OTHER` means "signup happens somewhere outside Konsti". `ProgramType.OTHER` means "miscellaneous category". Unrelated despite the shared word.

8. **EventName vs EventLog vs bare "event"**. `EventName` is the convention enum; `EventLog` is the notification feed; bare "event" is ambiguous and should be avoided.

9. **`signedToStartTime` invariant**. Lottery signups store the item's _own_ `startTime`; direct signups store the _parent-resolved_ time. Non-obvious — see CLAUDE.md before adding code that writes this field.

10. **noKonstiSignupIds vs ignoreProgramItemsIds**. Both block Konsti signup, but the former still imports the item (as informational), the latter excludes it from import entirely.

11. **Test time / active time / timeNow**. One frozen-clock mechanism under three labels: `serverConfig.useTestTime` (the switch), "Active time" (admin UI label), `getTimeNow()` (the reader).

12. **UserGroup.HELP vs "Helper"**. Enum value is `HELP`; the role is always called "Helper" in UI and docs. Do not rename to match.

13. **Attendee vs player vs participant**. Same role; i18n picks "player" for RPG/LARP and "participant" for everything else. Prefer "attendee" in code and general docs.

14. **Lottery signup vs two-phase signup**. Same concept. CLAUDE.md prefers "two-phase signup" for the _flow_; code uses `lotterySignup*` for the _submission_ and `isLotterySignupProgramItem` for the predicate. Both are fine; "two-phase" is clearer when describing flow.

15. **`SignupStrategy` is optional on `ProgramItem`**. If undefined, the effective strategy falls back to the event-wide `EventSignupStrategy`.
