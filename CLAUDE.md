# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Konsti is an event sign-up tool for conventions (Ropecon, Tracon, etc.). Users browse program items and sign up via lottery or direct sign-up (first-come-first-served). Supports group sign-ups, Kompassi OIDC integration, and admin assignment management.

See [docs/terminology.md](docs/terminology.md) for the glossary of domain terms.

## Design Choices

Some behaviour is settled deliberately and written down as a **design choice** rather than left to
the code to imply. The lottery's are in
[docs/en/lottery-design-choices.md](docs/en/lottery-design-choices.md); read them before changing
anything in that area.

- **Follow them.** When a design choice and a tidier implementation disagree, the implementation is
  usually the thing to change. A change that quietly makes a choice harder to hold is a bug even if
  every test passes.
- **Say so, clearly and up front, when a change would affect one.** Name the choice, say which way
  it moves, and let the developer decide before the work is done - not in a footnote afterwards.
  Changing a design choice must never come as a surprise.
- **Keep the document current.** A choice that changes is edited there in the same change that
  alters the behaviour, so the document never describes a rule the code stopped following. Adding a
  new choice, or retiring one, is the developer's call to make - propose it, don't assume it.

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
- **Keep code comments short — three lines is a lot, and a blank `//` line separating paragraphs means it is already too long.** State the non-obvious constraint or reason and stop. Leave out: what the code plainly does, benchmark numbers, worked examples of the failure, and the reasoning that led to the decision. One clause per reason is usually enough — "cached because every visible row asks the same question" earns its place; a paragraph explaining which rows, how often, and what the measured cost was does not. If a rule genuinely needs paragraphs, it belongs in the relevant `CLAUDE.md` or in [docs/en/lottery-design-choices.md](docs/en/lottery-design-choices.md), with the code comment pointing at it.
- Comments document how the code works now — don't describe how it used to work or what changed (that's what git history is for).
- Don't reference other files or components by name in code comments — renames and restructuring make them stale. Describe the role instead: "exported so callers can check...", not "exported so ProgramItemEntry can check...".
- Never use the em dash character (—) in code, UI text, comments, or docs. Use a regular hyphen (-) or restructure the sentence. CLAUDE.md files are the exception — they keep their established em dash style.
- **Prefer keeping an unused variable over an `eslint-disable`.** When a rule fires only because something is declared but never read, declare it anyway and let `no-unused-vars` ignore it, rather than suppressing the rule. Unused function arguments and destructured array elements take a leading underscore (`_foo`); a `useState` pair whose setter is never called keeps the conventional `setValue` name, which `react/hook-use-state` requires and `destructuredArrayIgnorePattern` therefore also ignores. Both patterns are in the root `eslint.config.ts`. The point is that the rule keeps applying to the rest of the file, where a suppression comment silently stops mattering as the code around it moves.
- **One assertion per `expect`.** Never fold two checks into one matcher with `&&` — `expect(body.status === "success" && body.assignmentRuns).toEqual([])` reports `false` when the status is wrong, naming neither what was expected nor which half failed. Write an `expect` per statement. When the `&&` is there to narrow a discriminated union (a `status: "success" | "error"` response, say), that is a sign to assert the whole object instead: `expect(body).toEqual({ status: "success", assignmentRuns: [] })` needs no narrowing and pins the rest of the shape too.
- **Import order is automated** by `@trivago/prettier-plugin-sort-imports` (root `prettier.config.ts`): builtins, npm packages, `shared/*`, workspace aliases (`client/*`, `server/*`, `playwright/*`, `scripts/*`, `assets/*`), then relative. Don't hand-order imports and don't add an ESLint ordering rule alongside it. Side-effect imports (`import "…"` with no bindings) are pinned where they're written, because some of them must run before their dependents — keep a comment saying why when the position matters.

## Terminology

- Don't use "FCFS" as shorthand for "first-come-first-served" — write it out in full.

## Git Commits

- **Don't commit unless asked.** Finish the work and leave it in the working tree so it can be reviewed as a whole; the same goes for pushing and for rewriting history (rebasing, squashing, amending). Report what changed instead, and wait to be told.
- Keep the message body to **at most two sentences** after the subject line: state what was wrong and what the change does, not the full reasoning behind it.
- Don't add a `Co-Authored-By: Claude ...` trailer (or any AI co-author line) to commit messages — keep the message plain, ending at the body.
- Don't reference CLAUDE.md (or its guidance) in commit messages — describe the change itself, not the doc it follows.
- Don't leave a `(cherry picked from commit ...)` trailer in the message: use plain `git cherry-pick`, never `-x`. When history is rebuilt (reordering or squashing a branch), the referenced hashes are the ones being replaced, so the trailer points at commits that no longer exist.

## Cross-Cutting Concerns

### Client-Server Communication

REST API over `fetch` (the client uses a hand-rolled wrapper, not axios). All endpoints are prefixed with `/api` (auth routes under `/auth`). Endpoint constants (`ApiEndpoint`, `ApiDevEndpoint`, `AuthEndpoint`) are defined in `shared/constants/apiEndpoints.ts`; request/response schemas live in `shared/types/api/...` (dev/test variants in `shared/test-types/api/...`). Dev client runs on port 8000, production server on port 5000 — in a git worktree both shift by an automatically assigned per-worktree `PORT_OFFSET` (`scripts/portOffset.ts`; see "Running multiple local instances" in the README). Client-side detail is in [client/CLAUDE.md](client/CLAUDE.md); server routes/middleware in [server/CLAUDE.md](server/CLAUDE.md).

### Database Lifecycle (no migrations)

Each convention runs its own MongoDB instance for the duration of the event only; afterwards the DB is dumped and the instance is torn down. There is no long-lived production DB and no cross-event continuity, so **schema/enum changes don't need migrations** — change the code and let the next event start with a fresh DB. **Do not add migration scripts, startup migration hooks, or backwards-compatibility shims.** DB mechanics and the past-event datafiles are documented in [server/CLAUDE.md](server/CLAUDE.md).

**Browser storage follows the same no-migrations model via event-prefixed keys.** Browsers keep localStorage across deploys and events on the same domain, so every Konsti storage key carries the `konsti-<eventName>-<eventYear>` prefix from `shared/constants/browserStorage.ts`, and `resetStaleEventStorage()` removes previous events' keys on page load. Old events' data is never read, so storage shape changes between events need no migration or compat handling — but don't change persisted shapes mid-event: a strict parse failure clears the session and logs users out. See "Local/session storage" in [client/CLAUDE.md](client/CLAUDE.md).

### Rate Limiting

There is **no application-level rate limiting**, by design — see [server/CLAUDE.md](server/CLAUDE.md) for the rationale (shared-NAT venue WiFi; avoiding login lockout abuse).

### Combined Code Coverage

`yarn coverage` builds one istanbul report for the whole project from both the vitest unit tests and the Playwright E2E suite. How the pipeline is wired - the three stages, the projection of E2E hits onto the vitest maps, the shared glob module, and the CI job - is documented in the `coverage-pipeline` skill.

## Test Data Credentials

- Admin: `admin:test`
- Regular users: `test1:test`, `test2:test`, `test3:test`
- Group users: `group1:test`, `group2:test`, `group3:test`
- Helper: `helper:test`
