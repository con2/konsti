# client/CLAUDE.md

Guidance for working in the `client/` workspace (React 19 + Vite SPA). See the [root CLAUDE.md](../CLAUDE.md) for the project overview and cross-cutting conventions, and [shared/CLAUDE.md](../shared/CLAUDE.md) for the types/config/constants this workspace imports.

Stack: React 19, Vite, Redux Toolkit, styled-components, react-router 8, react-hook-form, i18next (fi/en), Sentry. **No axios** — API calls go through a hand-rolled `fetch` wrapper (see below).

## Scripts

Run from the repo root as `yarn workspace client <script>`.

| Script                                                                       | What it does                                                                                                                                                            |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `start`                                                                      | Vite dev server on `http://127.0.0.1:8000` (root: `yarn client`)                                                                                                        |
| `build:dev` / `build:staging` / `build:prod` / `build:ci` / `build:kube-dev` | Vite build for the given mode (reads the matching `.env.*`); production uses the root `yarn build-front:prod`, which builds then copies `client/build` → `server/front` |
| `test` / `test:watch`                                                        | Vitest (jsdom env); coverage runs at the root (`yarn coverage:vitest`)                                                                                                  |
| `type-check`                                                                 | `tsc --noEmit`                                                                                                                                                          |
| `eslint`                                                                     | ESLint for this workspace                                                                                                                                               |
| `stylelint`                                                                  | Stylelint over the styled-components CSS-in-JS in `.ts`/`.tsx`                                                                                                          |

Note: `find-unused-translation-keys` is a **server** script (it scans `client/src`); run it via root `yarn find-unused-translation-keys`.

## Directory Layout (`client/src`)

- **`index.tsx`** — entry point: Sentry init, Redux `Provider`, styled-components `ThemeProvider`, then the lazily-loaded `App`.
- **`app/`** — `App.tsx` (initial data load + router wrapper), `AppRoutes.tsx` (all react-router routes), `HistoryContext.tsx` (tracks previous location for back buttons).
- **`views/`** — one folder per page/feature: `about`, `admin`, `admission-ticket`, `all-program-items`, `event-log`, `group`, `helper`, `login`, `logout`, `my-program-items`, `profile`, `program-item`, `registration`. A view folder typically holds `*View.tsx`, its Redux `*Slice.ts`, `*Thunks.ts`, and a local `components/`.
- **`components/`** — shared UI primitives (Button, Input, Checkbox, Header, etc.) and `icons/` (FontAwesome).
- **`services/`** — typed API call wrappers, one file per domain (`loginServices.ts`, `programItemsServices.ts`, `groupServices.ts`, …). Each just wraps `api.post/get/delete` with `shared/types/api/...` types.
- **`state/`** — only `loading/loadingSlice.ts` lives here; **the store itself and most slices do not** (see State Management below).
- **`locales/`** — `en.ts` and `fi.ts` translation objects.
- **`utils/`** — `store.ts` (Redux store), `hooks.ts` (typed Redux hooks), `api.ts` (fetch wrapper), `i18n.ts` (i18next setup + locale type-check), `localStorage.ts`/`sessionStorage.ts` (zod-validated), `getJWT.ts`, `checkUserGroup.ts`, etc.
- **`theme.ts`** — design tokens (colors, breakpoints, font sizes, popularity colors). **`globalStyle.ts`** — `createGlobalStyle`.
- **`markdown/`** — MDX content rendered as React components.
- **`test/`** — `setupTests.ts` (vitest/jsdom), `__mocks__/`, and dev-only UI helpers: `test-components/` (`TestTime` time selector, `TestGenerateSerial` registration-code button), `test-data/testDataServices.ts` (wrappers for the dev/test API endpoints). **`test/test-settings/testSettingsSlice.ts`** is the dev-only time-mock slice.
- **`types/`** — client-only types (`reduxTypes.ts`: `RootState`, `AppDispatch`, `AppThunk`).

## State Management

Redux Toolkit, **thunk-based** (not RTK Query). The store is configured in **`client/src/utils/store.ts`** (not under `state/`). Slices are **colocated with their view** (`views/*/​*Slice.ts`), plus `state/loading/loadingSlice.ts` and `test/test-settings/testSettingsSlice.ts`. Async logic lives in sibling `*Thunks.ts` files.

- Access state with the typed hooks in **`client/src/utils/hooks.ts`**: `useAppSelector` / `useAppDispatch` (never the untyped react-redux hooks).
- Slice files export their reducer, actions, and memoized selectors (`createSelector`).
- Logout is handled by a `rootReducer` wrapper that resets most slices but preserves a few (e.g. `admin`, `allProgramItems`, `testSettings`).
- A Redux/Sentry enhancer scrubs large or private payloads (e.g. signup messages) before they reach Sentry.

## Services / API Layer

The API client is **`client/src/utils/api.ts`** — a `fetch` wrapper (no axios), exposing `api.post/get/delete`. It:

- prefixes requests with `config.client().apiServerUrl`,
- injects `Authorization: Bearer <jwt>` from `getJWT()` (JWT is read from localStorage),
- aborts after a 60s timeout (`AbortController`),
- on network/HTTP error, dispatches `addError(...)` into Redux and returns an `ApiError`-shaped body,
- follows `301`/`302` JSON-body redirects via `location.href`.

Endpoint constants (`ApiEndpoint`, `ApiDevEndpoint`, `AuthEndpoint`) come from `shared/constants/apiEndpoints.ts`; request/response types from `shared/types/api/...`. To add an API call: add a function in the relevant `services/*.ts`, type it with the shared request/response types, and call it from a thunk that dispatches the result.

## Styling

styled-components only (no CSS modules, no component library). Pull tokens from the theme via props: `(props) => props.theme.breakpointPhone`. Responsive via `@media (max-width: ${(props) => props.theme.breakpointPhone})`. Global resets in `globalStyle.ts`. Stylelint (with the a11y plugin) lints the CSS-in-JS — run `yarn workspace client stylelint`.

**Always source colors from `client/src/theme.ts`** — never hard-code color values (hex/rgb) in components. Use `props.theme.<token>` in styled templates; in a context without props (e.g. module-level `keyframes`), `import { theme } from "client/theme"` and reference `theme.<token>` directly. Add a new token to `theme.ts` rather than inlining a one-off color.

**Don't export styled-components.** A module's public export should be a React component with explicit props that renders its styled elements; `styled` definitions stay module-private. Exporting a bare styled-component leaks styling as API and usually signals a composition problem — wrap it in a component instead (see `ProgramItemStatusMessage`). Restyling an imported component locally with `styled(Component)` is fine.

**Prefer component logic over stateful CSS.** When layout depends on application state, express it in the render logic, not in CSS selectors. A component with nothing to show returns `null` instead of rendering an empty element hidden with `:empty`/`display: none`, and spacing that depends on what renders around an element comes from explicit margins on the components involved, not from positional selectors like `:last-child` (a `display: none` element still matches structural pseudo-classes, and such CSS silently drifts from the render logic it mirrors).

## Internationalization

i18next, English + Finnish. Locale files: `client/src/locales/{en,fi}.ts` (deeply nested `as const` objects). `client/src/utils/i18n.ts` has an `expectLocalesToMatch` type-level check — if EN and FI don't have identical key shapes, type-check fails. The same `NestedKeyOf` machinery makes `t("...")` calls type-checked at the call site (missing keys are TS errors).

**Translation keys are client-only.** Server/shared/playwright code must never reference translation keys (the i18next instance only exists in the client). The unused-keys detector only scans `client/src` and treats any apparent reference outside as a bug to investigate, not a use.

**Dynamic key patterns to know about:**

- Template-built keys: `t(\`programType.${type}\`)`, `t(\`attendeeTypePlural.${getAttendeeType(programType)}\`)`. The detector tracks these as wildcard skeletons (`programType.\*`).
- Keys held as TS enum values: `enum PostLotterySignupErrorMessage { UNKNOWN = "signupError.generic", ... }`. Easy to miss with a naive grep for `t("…")`. The detector handles this by matching any string literal against the known key set.

`yarn find-unused-translation-keys` reports unused keys (exits 1 if any). Wired into `yarn lint` and the CI lint job. The event-log views (`views/event-log/`) render the program-item cancellation actions described in [server/CLAUDE.md](../server/CLAUDE.md) via `eventLogActions.*` keys.

## Build & Environment

- **Vite** (`client/vite.config.ts`): outputs to `client/build/` with sourcemaps; build target derived from `.browserslistrc`; plugins for MDX, SVGR (SVG→React), React, static copy, and gzip/brotli compression; `tsconfigPaths` resolves the `client`/`shared` aliases; dev server bound to `127.0.0.1:8000`.
- **React Compiler** (`babel-plugin-react-compiler`, `target: "19"`): enabled via the `react()` plugin's `babel.plugins` in `vite.config.ts`, so components are auto-memoized at build time. Its Rules-of-React lint checks are **not** the deprecated standalone `eslint-plugin-react-compiler` — they ship inside `eslint-plugin-react-hooks` (v7) `recommended` (`react-hooks/purity`, `immutability`, `preserve-manual-memoization`, etc.), already enabled in the root `eslint.config.ts`. The compiler auto-memoizes but does not change algorithmic complexity, so hand-written `Map`/`Set` lookups and stable references still matter for hot lists. It also does **not** replace `React.memo` on components rendered inside a `.map()` whose backing array is rebuilt (e.g. filtered lists) — the compiler memoizes elements by stable reference, which those don't have, so the row component still needs an explicit `memo` to bail out (see `ProgramItemEntry`).
- **Sentry source maps** (`@sentry/vite-plugin`, last in the plugin list): for `production`/`staging` builds — and `development` builds when `enableSentryInDev` is set — it injects debug IDs into the bundle, uploads the maps to the matching `konsti-frontend-{prod,staging,dev}` project, then deletes the `.map` files so they aren't shipped. It only runs when a `SENTRY_AUTH_TOKEN` is available — a build secret in the Docker build via `deploy.yml`, or the gitignored `client/.env.sentry-build-plugin` file for local builds (copy `.env.sentry-build-plugin.sample`); without a token it's skipped and the build proceeds. Debug IDs mean symbolication works without a `release` in `init()`. The deployed bundle is built (and uploaded from) inside the `Dockerfile` so the served files carry the IDs that match the uploaded maps — `SENTRY_RELEASE` is passed in as a build-arg because the Docker context has no `.git`. Because the upload runs during the image **build** (before the `deploy` job in `deploy.yml`), a _failed_ deploy still leaves the new release's maps uploaded — this is harmless: debug IDs are content-addressed, so the unused maps are never consulted while the still-live previous bundle keeps symbolicating against its own maps. The only residue is a finalized frontend release in Sentry for a SHA that never went live (no events attach to it). Uploading at build time is Sentry's recommended pattern for exactly this reason.
- **Env files** are selected by build `--mode`: `.env.development`, `.env.staging`, `.env.production`, `.env.ci`, `.env.kube-dev`. Vite's `define` exposes config as `process.env.SETTINGS`, `process.env.API_SERVER_URL`, `process.env.SHOW_TEST_VALUES`, `process.env.DATA_UPDATE_INTERVAL` (these are **not** `VITE_`-prefixed) — they feed `config.client()` in `shared/config`.
- **Browser support:** `.browserslistrc` targets browsers from roughly the last 5 years; `eslint-plugin-compat` and `stylelint-no-unsupported-browser-features` enforce it.

## Testing

Vitest with the jsdom environment; setup in `client/src/test/setupTests.ts` (initializes i18next with EN and dayjs). Coverage via Istanbul. There are few committed unit tests today — add them alongside the component/view under test.

**Don't write component (rendering) tests** — there is no testing-library dependency, and rendered UI behavior is covered by the Playwright E2E suite instead (see [playwright/CLAUDE.md](../playwright/CLAUDE.md)). Keep client vitest tests to pure functions/utils (e.g. `programItemUtils.test.ts`); when a fix changes what a component renders, add or extend an E2E spec.

For the combined-coverage flow (`yarn coverage`, see the root CLAUDE.md), starting the dev server with `COVERAGE=true` serves istanbul-instrumented code (`vite-plugin-istanbul`) and disables the react-compiler babel plugin (its rewrites break the coverage source positions). `client/coverageCollectorPlugin.ts` then harvests the browser's `window.__coverage__` server-side: it injects a flush script into `index.html` and receives the data on a `/__coverage__` dev-server middleware, so the Playwright suite needs no coverage hooks of its own.

## Other Notes

- **Forms:** react-hook-form (`useForm`, `register`, `handleSubmit`); validation messages come from i18next keys.
- **Lazy loading:** `utils/lazyWithRetry.ts` wraps `React.lazy` to retry failed dynamic imports.
- **Local/session storage:** zod-validated in `utils/localStorage.ts` / `utils/sessionStorage.ts`; session state (incl. JWT) lives under the event-prefixed state key. All Konsti storage keys carry the `konsti-<eventName>-<eventYear>` prefix from `shared/constants/browserStorage.ts` (also used by the Playwright login helper), and `utils/resetStaleEventStorage.ts` (called in `index.tsx`) removes previous events' keys on page load — so old events' data is never read and needs no migration. Prefix any new storage key the same way. Within one event, don't change persisted shapes: the JWT shares the state object with saved preferences, and a strict parse failure clears the session and logs the user out.
- **Dev tooling:** axe-core (a11y) and why-did-you-render run in dev when enabled in client config.
- **User-group checks:** `utils/checkUserGroup.ts` (`isUser`/`isAdmin`/`isAdminOrHelper`) gate views and UI.
