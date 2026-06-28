# playwright/CLAUDE.md

Guidance for the `playwright/` end-to-end tests. See the [root CLAUDE.md](../CLAUDE.md) for the project overview and cross-cutting conventions.

`playwright/` is **not a Yarn workspace** and has no `package.json` — the E2E scripts live in the **root** `package.json`, and it's type-checked/linted as part of the root (`tsc -p tsconfig.json`, `eslint:root`). It imports shared types directly via the `shared/*` path alias.

## Running

| Command (repo root)        | What it does                                                                                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn playwright`          | Local run: starts MongoDB (`docker:db`), then in parallel runs the server in test mode (`server:test`, port 5000), the client dev server (port 8000), and the Playwright **UI** (`playwright install` + `playwright test --ui`) |
| `yarn playwright:debug`    | Runs the suite headed with `PWDEBUG=1` (step-through inspector)                                                                                                                                                                 |
| `yarn playwright:trace`    | Opens a saved `trace.zip` in the trace viewer                                                                                                                                                                                   |
| `yarn docker-compose:test` | Full containerized CI run: builds the server image (`APP_SETTINGS=ci`) and runs `docker/docker-compose.yml` + `playwright/docker-compose.yml` together, exiting with Playwright's exit code                                     |

**`run-e2e` rebuilds the `playwright` image before `up`** (`docker compose build playwright`). The service is build-only, so a bare `docker compose up` reuses a cached image and would silently run a **stale** copy of the specs after local edits — the explicit build keeps every run on the current `tests/`/`pages/`. It's near-free on repeats (Docker layer-caches `yarn install`) and in CI (fresh runners build once anyway), and it builds **only** the test image — `server` is the heavyweight one, built separately by `docker:build-ci`, so this doesn't touch it. Don't drop the build step.

### Sharding

CI splits the suite across runners with [Playwright sharding](https://playwright.dev/docs/test-sharding). The `e2e` job in `.github/workflows/test.yml` is a matrix over `shard: [1, 2, 3]`, and passes `PLAYWRIGHT_SHARD=<index>/<total>` (e.g. `2/3`). `playwright/docker-compose.yml` reads `PLAYWRIGHT_SHARD` and appends `--shard=$PLAYWRIGHT_SHARD` only when it's set; unset (the local default) runs the whole suite.

Each shard is a separate runner spinning up its **own** docker-compose stack (own server + Mongo), so the shared-DB constraint that forces `workers: 1` still holds **within** a shard — sharding parallelizes across machines, not within one DB. To change the shard count, edit the matrix list **and** keep using `strategy.job-total` for the denominator. To shard a local run: `PLAYWRIGHT_SHARD=1/3 yarn docker-compose:test`.

**Why 3 and not more:** each shard re-pays a fixed per-runner overhead (image build, Mongo/server startup), which sets a wall-clock floor that more shards can't beat. Measured: no-shard ≈ 4m34s, 2 shards ≈ 3m38s, 3 shards ≈ 3m08s, 4 shards ≈ 3m18s (4 regressed — overhead swamped the extra split).

**Keep the `yarn install` step in the `e2e` job** even though `docker-compose:test` builds the app inside Docker — Yarn 4 here refuses to run _any_ script without the `node_modules` install-state file (`Couldn't find the node_modules state file`), so removing it fails every shard in ~15s.

**No image-build caching:** each shard builds the `server` image itself via `docker-compose:test` (the default Docker driver, straight into the daemon). This was measured against a `docker/build-push-action` + GitHub Actions layer cache (`type=gha`) setup, which turned out **slower** (~300s vs ~190s per shard): the `docker-container` driver's image export/load round-trip and the `type=gha` cache transfer cost more than rebuilding, and `cache-to,mode=max` penalized the writer shard. The per-shard build is already fast and parallel, so there's nothing to cache-win here — don't re-add buildx/gha caching.

**Merged HTML report:** in CI (`process.env.CI`) the config adds a `blob` reporter alongside the console `list`. Each shard writes `blob-report/report-<shard>.zip`, which `playwright/docker-compose.yml` volume-mounts out of the container; the shard then uploads it as the `blob-report-<shard>` artifact. The separate `merge-reports` job (`needs: e2e`, runs even if a shard failed) downloads all of them and runs `npx playwright merge-reports --reporter html` to produce the single `playwright-html-report` artifact. Locally the reporter stays the default `list`. The merged blob data also gives Playwright per-test timing it uses to balance future shards.

Local prerequisites: Docker running, and ports **5000** (server), **8000** (client), **27017** (Mongo), and the Playwright UI port free.

To run one or more specs **headlessly against an already-running app** (handy while iterating), invoke Playwright directly instead of the `--ui` script:

```bash
npx playwright install chromium   # once, if the browser binary is missing
npx playwright test --config playwright/playwright.config.ts profile logout   # bare args filter by filename
```

`testDir` defaults to the config file's directory, so specs under `tests/` are auto-discovered.

## Config (`playwright.config.ts`)

- **Browsers:** only **Chromium** is enabled (project "Chrome Stable"); Firefox/WebKit/mobile are behind `ENABLE_*` flags that are currently `false`. Flip a flag to add a project.
- **`baseURL`:** `process.env.PLAYWRIGHT_BASEURL ?? "http://localhost:8000"` — i.e. `page.goto("/")` hits the **client** locally, and the Docker run sets `PLAYWRIGHT_BASEURL=http://server:5000`.
- **`workers: 1`** (serial — tests share one DB, so no parallelism).
- **`retries`:** `1` in CI, `0` locally.
- **`trace`/`video`:** `"on"` locally, `"on-first-retry"` in CI; output in `./test-results` (bind-mounted out of the container in Docker runs).
- `headless: true`, `ignoreHTTPSErrors: true`.

## Docker Setup

`playwright/Dockerfile` builds on `mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble`, copies the root `package.json`/`tsconfig.json`, `playwright/`, and `shared/`, and installs deps. `PLAYWRIGHT_VERSION` is read from the root `package.json` `@playwright/test` version (so the image matches the installed version exactly). `playwright/docker-compose.yml` adds a `playwright` service that `depends_on: server`, waits for `server:5000` to be reachable, and runs the suite against the in-network server.

## Helpers (`playwrightUtils.ts`)

Tests drive app state through the server's **dev/test API** (not the UI) for setup. Note its API base is `process.env.PLAYWRIGHT_BASEURL ?? "http://localhost:5000"` (defaults to the server, unlike the config's `baseURL`). Exported helpers:

- **`populateDb(request, options)`** — `POST /api/populate-db` to seed users/admin/program-items/signups/event-log (the dev-only endpoint; see [server/CLAUDE.md](../server/CLAUDE.md)).
- **`clearDb(request)`** — `POST /api/clear-db`.
- **`addProgramItems(request, items)`** — `POST /api/add-program-items` to add/modify items mid-test (commonly a spread of `testProgramItem` from `shared/tests/` with tweaked `startTime`/`programType`/attendance/`state`).
- **`addSerials(request, count)`** — `POST /api/add-serial`; returns the created registration codes (`string[]`). Local account creation always requires a valid code, so a registration spec must mint one with this helper.
- **`login(page, request, { username, password })`** — logs in via the API, navigates to `/`, then writes the JWT into `localStorage` under `state.login.jwt`. This **bypasses the login form** — use it for setup; test the form itself in `login.spec.ts`. The JWT is written **after** that navigation, so **call `await page.goto("/")` again after `login()`** or the app stays anonymous.
- **`postSettings(request, settings)`** / **`postTestSettings(request, settings)`** — admin-authenticated `POST /api/settings` and `POST /api/test-settings`. `postTestSettings({ testTime })` **mocks server time**, which governs signup windows and whether the lottery has "run".
- **`testPostDirectSignup(request, username, req)`** — direct-signup as another user (e.g. to fill a slot before the user under test).
- **`postAssignment(request, assignmentTime)`** — trigger the lottery at a given time.

Helpers log in as `admin:test` internally where admin rights are needed. Test credentials are in the [root CLAUDE.md](../CLAUDE.md).

## Tests (`playwright/tests/`)

Specs cover the main user flows: auth (`login`, `kompassiLogin`, `registration`, `logout`), signup (`lotterySignup`, `directSignup`, `favorite`, `admission`), groups (`group`, `groupManage`), discovery (`programSearch`, `programListQueryParams` — the `programType`/`invalid` program-list URL params), staff tools (`admin`, `adminConsole`, `helper`), `profile`, `about`, and program-item lifecycle (`cancelProgramItem`, `moveProgramItem` — the cancellation/start-time-change notifications described in [server/CLAUDE.md](../server/CLAUDE.md)).

### Page Objects (`pages/`)

UI selectors live in **page object classes** under `playwright/pages/`, not inline in specs. Each class wraps one UI surface, owns its locators, and exposes high-level action methods, so a selector is defined in exactly one place. Specs instantiate them directly — `const programList = new ProgramListPage(page)` — matching the plain-function style of `playwrightUtils.ts` (no Playwright fixtures).

- `BasePage` — every page extends it; provides `main` (`#main`) and composes `navigation` (the drawer) and `notificationBar`.
- Components: `Navigation`, `NotificationBar`, and `ProgramItemCard` (wraps a single `program-item-container`; `ProgramListPage.firstItem()` / `itemByTitle()` return one).
- Pages: `LoginPage`, `RegistrationPage`, `ProgramListPage` (both tabs plus the My Program lists), `ProgramItemPage`, `ProfilePage`, `GroupPage`, `AdminPage`, `HelperPage`, `AboutPage`.

Keep **assertions in the specs** (`expect(...)`) — page objects return locators and perform actions, they don't assert. `playwrightUtils.ts` stays the home for API/setup helpers (DB seeding, API login, settings); those are not selectors.

Conventions:

- Setup order in a test is typically: `populateDb` → `addProgramItems` → `postSettings`/`postTestSettings` (config + mock time) → `login` → navigate → interact → assert.
- Add UI selectors to a page object (see above), not to specs; within a page object prefer stable locators: `data-testid` attributes and role/text locators (`getByRole`, `getByTestId`), composed with `.filter(...)`/`.nth(n)` for lists.
- Tests assume the **English** locale and assert against EN text (use case-insensitive regex for resilience).
- Add explicit waits (`waitForURL`, `waitForResponse`, `expect(...).toContainText`) rather than fixed sleeps; the suite is serial, so don't rely on parallelism.

### Authoring gotchas

Learned while adding the flows above — these save a round of trial and error:

- **Reload after `login()`** so the app boots authenticated (see Helpers).
- **`#main` is `BasePage.main`:** page content renders inside `#main`; assert against `<page>.main` rather than re-deriving `page.locator("#main")`.
- **Navigation (`Navigation`):** the drawer (`data-testid="navigation-icon"`) and its links are wrapped by `<page>.navigation` — `gotoProfile()` (the `link-profile` testid), `gotoProgram()/gotoAdmin()/gotoHelper()`, `logout()`. The link-by-text helpers use `{ exact: true }` because a program item whose title starts with e.g. "Helper" otherwise collides with the "Helper" nav link (strict-mode violation).
- **Program-type filter (`ProgramListPage.selectProgramType`):** select by the visible option label (`"Tabletop RPG"`), not the enum value. The list only shows items of the active program type, so set it before counting `items`.
- **Search & empty state (`ProgramListPage.search`):** backed by the `#find` box; "no results" renders `No {type} found, please check your search conditions.`
- **Two "Save" buttons:** in Profile / `ChangeUserSettingsForm` the email Save is `nth(0)` and the password Save is `nth(1)` — use `ProfilePage.saveEmail()` / `savePassword()` (and `HelperPage.changePassword()` for the helper view's password Save).
- **Form fields:** `RegistrationPage` owns these — ids `#username`/`#serial`/`#registerDescriptionCheckbox`/`#email-notifications-enabled`(`/-disabled`)/`#email`; the registration password input has **no** id, so it targets `input[type="password"]`.
- **Roles are an explicit allow-list, not a hierarchy:** `admin` is **not** auto-allowed on helper-only routes. `GET /api/signup-message` is `requireAuth(HELPER)`, so sign in as `helper` for private-message flows (admin gets 401). See [server/CLAUDE.md](../server/CLAUDE.md).
- **Kompassi login E2E needs the mock:** it only passes when the server resolves Kompassi to the bundled mock (`SETTINGS=ci`, or `KOMPASSI_BASE_URL` pointed at the local server). Under `yarn playwright` (`SETTINGS=development` with a real `KOMPASSI_BASE_URL`) the OAuth step redirects to the real Kompassi and the test can't complete — run `kompassiLogin` via `yarn docker-compose:test`.
