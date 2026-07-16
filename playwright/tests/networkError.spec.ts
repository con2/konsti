import { test, expect, Page, Locator } from "@playwright/test";
import {
  login,
  populateDb,
  postSettings,
  postTestSettings,
} from "playwright/playwrightUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { HelperPage } from "playwright/pages/HelperPage";
import { ProfilePage } from "playwright/pages/ProfilePage";
import { config } from "shared/config";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { LoginProvider } from "shared/config/eventConfigTypes";

// The client suppresses the network error toast for failed background
// requests while offline and briefly (5 s grace period) after
// connectivity/page-resume events, verifies suppressed failures with a probe
// request after the grace period, heals the toast on any successful
// response, and shows failures of user-initiated requests immediately. Aborting routes simulates network
// failure while keeping navigator.onLine true, matching the real wake-up
// cases. The grace period is entered through the online event here — one
// listener downstream of the page-resume machinery, which Playwright can't
// drive for real (no visibility emulation)

// Clock jumps tied to the client's suppression timings: the toast decision
// runs 1 s after a failure and the grace period lasts 5 s, so a 2 s jump
// fires pending decisions while still inside the grace period; the probe
// fires 1 s after the grace period ends, so a 7 s jump reaches it; polling
// runs every 60 s
const PAST_TOAST_DECISIONS = "00:02";
const PAST_PROBE = "00:07";
const PAST_POLL_TICK = "01:01";

// Abort all API requests and return a getter for how many were aborted.
// The app loads data with sequential requests, so a count of 2+ proves the
// first rejection was fully processed and its decision timer is scheduled
const abortApi = async (page: Page): Promise<() => number> => {
  let failures = 0;
  await page.route("**/api/**", async (route) => {
    failures++;
    await route.abort();
  });
  return () => failures;
};

const restoreApi = async (page: Page): Promise<void> => {
  await page.unroute("**/api/**");
};

// Answer all API requests with an HTTP error instead of failing them at the
// network level — a captive portal or gateway interception behaves like
// this: the request resolves, but not from the app server
const fulfillApiWithHttpError = async (page: Page): Promise<() => number> => {
  let failures = 0;
  await page.route("**/api/**", async (route) => {
    failures++;
    await route.fulfill({ status: 503 });
  });
  return () => failures;
};

// Freeze the mocked clock so timers fire only on explicit jumps — an
// installed clock otherwise keeps advancing in real time, and slow CI steps
// could push a toast decision past the grace period or fire a straggler
// timer mid-assertion. The pause target must sit safely ahead of the page's
// mocked clock (pausing into the past throws), hence the offset
const pauseClock = async (page: Page): Promise<void> => {
  await page.clock.pauseAt(Date.now() + 1000);
};

// Advance the mocked clock in steps until the locator is visible: fetch
// rejections settle on the real event loop between steps, so a single big
// jump could run before the failure handler has scheduled its next timer
const fastForwardUntilVisible = async (
  page: Page,
  locator: Locator,
): Promise<void> => {
  await expect(async () => {
    await page.clock.fastForward("00:05");
    await expect(locator).toBeVisible({ timeout: 200 });
  }).toPass({ timeout: 30_000 });
};

test("Network error toast appears during an outage, heals on recovery, and is dismissible", async ({
  page,
  request,
}) => {
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
    programItems: true,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  // Mock browser timers so the data poll (dataUpdateInterval, 60 s) can be
  // fast-forwarded instead of waited for. Must be installed before the app loads
  await page.clock.install();
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();
  await pauseClock(page);

  // Sever the connection and let the next poll fail
  const failures = await abortApi(page);
  await page.clock.fastForward(PAST_POLL_TICK);
  await expect.poll(failures).toBeGreaterThanOrEqual(2);

  // Outside any grace period the failed poll shows the toast after the
  // decision delay
  await fastForwardUntilVisible(page, programList.errorBar.networkError);

  // The next successful poll heals the toast without user action
  await restoreApi(page);
  await page.clock.fastForward(PAST_POLL_TICK);
  await expect(programList.errorBar.networkError).toBeHidden();

  // The toast can also be dismissed by clicking it; flush the failed poll's
  // remaining decision timers first so a straggler can't re-add the toast
  // right after the click
  await abortApi(page);
  await page.clock.fastForward(PAST_POLL_TICK);
  await fastForwardUntilVisible(page, programList.errorBar.networkError);
  await page.clock.fastForward(PAST_TOAST_DECISIONS);
  await programList.errorBar.dismissNetworkError();
  await expect(programList.errorBar.networkError).toBeHidden();
});

test("Refresh failing right after reconnect stays silent when the connection recovers", async ({
  page,
  request,
}) => {
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
    programItems: true,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.clock.install();
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();
  await pauseClock(page);

  // Reconnect while the network is still coming up: the online event stamps
  // the grace period and triggers an immediate refresh, which fails
  const failures = await abortApi(page);
  await page.evaluate(() => {
    globalThis.dispatchEvent(new Event("online"));
  });
  await expect.poll(failures).toBeGreaterThanOrEqual(2);

  // The failures land inside the grace period: no toast, a probe is
  // scheduled for after the grace period instead
  await page.clock.fastForward(PAST_TOAST_DECISIONS);
  await expect(programList.errorBar.networkError).toBeHidden();

  // The network is back before the probe fires, so the probe succeeds and
  // the whole blip stays silent — this is the phone-wakes-before-Wi-Fi case.
  // Await the probe's real response before jumping again, or the next jump
  // would fire the probe's timeout while its request is still in flight
  await restoreApi(page);
  const probeResponse = page.waitForResponse(`**${ApiEndpoint.HEALTH}`);
  await page.clock.fastForward(PAST_PROBE);
  await probeResponse;
  await page.clock.fastForward(PAST_POLL_TICK);
  await expect(programList.errorBar.networkError).toBeHidden();
});

test("Genuine outage at reconnect time surfaces the toast via the probe", async ({
  page,
  request,
}) => {
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
    programItems: true,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.clock.install();
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();
  await pauseClock(page);

  // Reconnect during a real outage: the refresh fails inside the grace
  // period and is suppressed
  const failures = await abortApi(page);
  await page.evaluate(() => {
    globalThis.dispatchEvent(new Event("online"));
  });
  await expect.poll(failures).toBeGreaterThanOrEqual(2);
  await page.clock.fastForward(PAST_TOAST_DECISIONS);
  await expect(programList.errorBar.networkError).toBeHidden();

  // Suppression is not final: the probe fires after the grace period, also
  // fails, and surfaces the toast
  await fastForwardUntilVisible(page, programList.errorBar.networkError);
});

test("HTTP errors on background requests count as connectivity issues inside the grace period", async ({
  page,
  request,
}) => {
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
    programItems: true,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.clock.install();
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();
  await pauseClock(page);

  // Reconnect through a captive portal: the refresh's requests resolve with
  // HTTP errors instead of failing at the network level
  const failures = await fulfillApiWithHttpError(page);
  await page.evaluate(() => {
    globalThis.dispatchEvent(new Event("online"));
  });
  await expect.poll(failures).toBeGreaterThanOrEqual(2);

  // Inside the grace period the HTTP errors count as connectivity issues:
  // no API error toast, no network error toast — a probe is scheduled
  await page.clock.fastForward(PAST_TOAST_DECISIONS);
  await expect(programList.errorBar.items).toHaveCount(0);

  // Even the probe's 503 answer proves connectivity, so the blip stays
  // silent
  const probeResponse = page.waitForResponse(`**${ApiEndpoint.HEALTH}`);
  await page.clock.fastForward(PAST_PROBE);
  await probeResponse;
  await expect(programList.errorBar.items).toHaveCount(0);

  // Outside the grace period the same HTTP errors surface as API errors,
  // not as network errors
  await page.clock.fastForward(PAST_POLL_TICK);
  await expect(programList.errorBar.apiError.first()).toBeVisible();
  await expect(programList.errorBar.networkError).toBeHidden();
});

test("Failed favorite action shows the toast immediately", async ({
  page,
  request,
}) => {
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
    programItems: true,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();

  // Only the favorite request fails — background polling keeps succeeding
  await page.route(`**${ApiEndpoint.FAVORITE}`, async (route) => {
    await route.abort();
  });

  // User-initiated request failures skip the suppression machinery entirely
  await programList.firstItem().favorite();
  await expect(programList.errorBar.networkError).toBeVisible();
});

test("Failed helper user search shows the toast immediately", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  // The find-user tool only renders for local-login events
  await postSettings(request, { loginProvider: LoginProvider.LOCAL });
  await login(page, request, { username: "helper", password: "test" });

  await page.goto("/");

  const helperPage = new HelperPage(page);
  const signupMessagesLoaded = page.waitForResponse(
    `**${ApiEndpoint.SIGNUP_MESSAGE}`,
  );
  await helperPage.open();
  // The view's own mount requests must settle before failures are injected —
  // a success landing after the aborted search would heal the toast under
  // assertion
  await signupMessagesLoaded;

  await page.route(
    `**${ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME}*`,
    async (route) => {
      await route.abort();
    },
  );

  // The find-user request is not one of the app's own background requests,
  // so its network failure toasts instead of being mistaken for the user
  // not existing
  await helperPage.findUser("test1");
  await expect(helperPage.errorBar.networkError).toBeVisible();
});

test("Failed session refresh after email change shows the form error", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.LOCAL });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const profilePage = new ProfilePage(page);
  await profilePage.navigation.gotoProfile();

  // The email update itself succeeds, but the session refresh that follows
  // it fails — the form must report the failure instead of success, even
  // though the failed request gets the suppressed background error handling
  await page.route(`**${ApiEndpoint.SESSION_RESTORE}`, async (route) => {
    await route.abort();
  });

  await profilePage.emailNotificationsEnabled.check();
  await profilePage.emailInput.fill("test1@example.com");
  await profilePage.saveEmail();
  await expect(profilePage.main).toContainText("Error updating email address");
});
