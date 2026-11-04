# Real-device checks on BrowserStack

Checks of the client's page-resume handling on real iOS Safari: the screen turned off and on, Safari backgrounded and foregrounded, and a page restored from the back/forward cache. The Playwright suite cannot drive any of these, and Playwright's WebKit build is not Safari, so this runs on real iPhones through [BrowserStack Automate](https://automate.browserstack.com): in CI on pull requests that touch that handling (see In CI below), and by hand with the steps here.

## Prerequisites

- A BrowserStack account with Automate real-device minutes. A full run holds four sessions at once for about four minutes; the plan's 5 parallel sessions leave one free.
- Credentials in `browserstack/.env.browserstack`, copied from `.env.browserstack.sample`. The username and access key are under Account, Settings, Authentication & Security on browserstack.com. The username is the generated one shown next to the key, not the login email. The file is gitignored and dockerignored.
- A local MongoDB, as for the E2E suite.

## Running

Four terminals in the repository root:

```sh
# 1. The test server, which has the endpoints the check seeds data through
yarn server:test

# 2. A client build whose API URL is the front server's origin as the phone sees it
yarn browserstack:build

# 3. The front server: serves that build and proxies the API, so the phone talks to one origin
yarn browserstack:front

# 4. The check itself
yarn browserstack:test
```

The last command is a vitest run with `browserstack/vitest.config.ts`. Its global setup seeds the database once and starts the BrowserStack Local tunnel so the phones can reach the servers on your machine; the test file then runs four Safari sessions at once, two per device with two scenarios each, so a full run takes about four minutes. Each scenario logs its verdict and a one-line summary, and vitest reports it as passed, failed or skipped. Output from the sessions interleaves; each block is labelled with its test. The exit code is non-zero when any scenario failed.

```
stdout | tests/safariResume.test.ts > Safari page resume > 3 backgrounded 10 s does not load on foregrounding on iPhone 16 iOS 18
  PASS, no load within 3 s of showing, the tick delivered the item after 45 s
 ✓ tests/safariResume.test.ts > Safari page resume > 3 backgrounded 10 s does not load on foregrounding on iPhone 16 iOS 18 62370ms
```

Narrow the run with environment variables: a substring of a device name, and comma-separated scenario numbers. `BROWSERSTACK_VERBOSE=1` adds the measurements behind each verdict (load count, timings, the lifecycle events seen).

```sh
BROWSERSTACK_DEVICE="iPhone 14" yarn browserstack:test
BROWSERSTACK_DEVICE="iPhone 16" BROWSERSTACK_SCENARIOS=4,1 BROWSERSTACK_VERBOSE=1 yarn browserstack:test
```

Rebuild (step 2) whenever the client changes. The build bakes in the front server's port, which follows the same per-worktree offset as the dev servers, so run all four commands from the same checkout.

## What it does

The check logs in as `test1`, opens the program list, and for each scenario adds a program item on the server while the page cannot see it. It then reports whether the page picked the item up on its own once shown again, how many data loads that took, how soon after the page became visible the first one started, and which `visibilitychange`, `pagehide` and `pageshow` events the page saw.

| Scenario                                     | Expected                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1. Screen off for 90 s, then wake and unlock | One load right after the unlock, item rendered                                          |
| 2. Safari backgrounded for 90 s              | One load right after foregrounding, item rendered                                       |
| 3. Safari backgrounded for 10 s              | No load on foregrounding, the regular poll delivers the item within a minute            |
| 4. Navigate to another site, back after 90 s | Page restored from the bfcache with `pageshow persisted: true`, one load, item rendered |

A FAIL on a 90 s scenario means the page loaded nothing, or more than once, after being shown again: a real finding against the client's resume handling. UNCLEAR means Safari reloaded the page instead of resuming it, or did not restore it from the bfcache, so that scenario did not exercise the path it is there for; rerun it alone before drawing a conclusion.

Each session's video and network log are on the Automate dashboard under the build named "Safari page resume".

## Devices

The device list is at the top of `tests/safariResume.test.ts`. Pick names from [BrowserStack's device list](https://www.browserstack.com/list-of-browsers-and-platforms/automate); an unavailable device fails its session at startup and vitest moves on to the next one.

## In CI

`.github/workflows/browserstack.yml` runs the same check on GitHub Actions. It starts on pull requests that change the client code that starts and runs the polling, the session storage and the client build config it relies on, the shared constants, fixtures and helpers it imports, anything under `browserstack/` or the workflow itself (the workflow's `paths` list is the exact set), but not dependency bumps, and from the Actions tab with **Run workflow** (once the workflow is on `main`). One run goes at a time across all branches, and a running one is never cancelled: each holds four of the account's five device sessions, and a cancelled run leaves its sessions holding those slots until they idle out. GitHub keeps only one waiting run, so a newer run replaces a waiting one; re-run a replaced pull request's check by hand.

It needs two repository secrets, `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY`, with the same values as `.env.browserstack`. Each run appears on the Automate dashboard as its own build, "Safari page resume" followed by the run id, with the session videos and network logs; a failed run also uploads the test server and front server logs as an artifact.

A failure reading "The BrowserStack session broke" is the device session ending under the test, not a finding against the app: rerun the job before reading anything into it.

## Manual Android check

There is no Android spec: Chrome on Android is the Chromium the Playwright suite already runs, so the remaining question is only how Chrome's background throttling meets the poll timer, and a manual check answers it in ten minutes. Watch the data loads in Chrome's remote DevTools while putting the phone through the same four situations.

1. Enable USB debugging on the phone, plug it in, and open `chrome://inspect` in desktop Chrome.
2. Give the phone a build to load. On staging, once the change is deployed, open the staging URL on the phone. Before that, forward a port over USB: in `chrome://inspect` enable **Port forwarding** with the front server's port on the device mapped to the same port on your machine, then build and serve against that origin with the test server running. The front server listens on 8000 in the main checkout and on 8000 plus the worktree's port offset in a worktree (`yarn browserstack:front` prints it); the commands below use 8000:

   ```sh
   yarn server:test
   PORT_OFFSET=0 API_SERVER_URL=http://localhost:8000 yarn workspace client build:dev
   yarn browserstack:front
   ```

   The phone's `localhost` is forwarded to your machine, which is why this build uses that host rather than the `bs-local.com` one `yarn browserstack:build` bakes in; `PORT_OFFSET=0` stops the client config from swapping in its own localhost API URL. Open `http://localhost:8000` on the phone.

3. Log in, open the program list, click **inspect** for the tab on the desktop, open the **Network** panel, filter by `settings` and tick **Preserve log**. Every data load starts with one `settings` request, so each row is one load; in the foreground one row arrives per minute.

| Do on the phone                                            | Expect in the Network panel                                                                                                                                            |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Press home, wait 2 min, return to Chrome                   | No rows while away; one row within a second of returning, the next a minute later                                                                                      |
| Press home, wait 10 s, return                              | No row on return; the next row at the regular minute                                                                                                                   |
| Lock the screen, wait 2 min, unlock                        | No rows while locked; one row within a second of unlocking                                                                                                             |
| Go to another site in the same tab, wait 2 min, press back | One `settings` row and no document request; a full page load means Chrome reloaded instead of restoring the page, which is fine but leaves the resume path unexercised |

Without DevTools, change a program item's title through the admin view on another device while the phone is away; the new title should appear on its own within a second of returning, without pulling to refresh.

Normal, not failures: DevTools disconnects while the tab is frozen and reconnects on return, and Chrome may discard a background tab under memory pressure, in which case returning shows a full page load.

## Troubleshooting

- **"Nothing answers at http://127.0.0.1:5002/api/health"** (or the front server's port): the named server is not running. The check refuses to start a device session until both local servers answer.
- **"The test server at http://127.0.0.1:5002 stopped answering"** mid-run: the test server went away after the check started. Its seeding calls ride out a watcher restart of up to 15 s, so this means the server process ended; its own terminal says why. A scenario in flight at that moment shows a load with the item never appearing, which is the API failing, not the client.
- **"Initial program never rendered"** with "Internal Server Error" or an empty body: the front server is not running, or the build is missing. The phone reaches your machine only as `bs-local.com`, so `localhost` and `127.0.0.1` in any URL point at the phone itself.
- **"Error while calling POST /api/session-restore"** in the page body: a request reached the test server with an origin its CORS allowlist rejects. Check that the API calls go through the front server rather than straight to the test server's port.
- **"Unknown mobile command"**: BrowserStack allows only a subset of Appium's `mobile:` commands on iOS Safari. The harness uses the permitted ones (`pressButton`, `activateApp`, `performIoHidEvent`, `queryAppState`); the error message lists the full set.
