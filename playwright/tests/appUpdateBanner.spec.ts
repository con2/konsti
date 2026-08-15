import { Page, expect, test } from "@playwright/test";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { AppUpdateBanner } from "playwright/pages/AppUpdateBanner";
import { ProgramItemPage } from "playwright/pages/ProgramItemPage";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  clearDb,
  populateDb,
  postTestSettings,
  reportServerBuildTime,
} from "playwright/playwrightUtils";

// A marker attribute on the document detects reloads independently of the
// mocked clock (which replaces the performance API): a real reload wipes it,
// a client-side route transition keeps it
const setPageMarker = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    document.body.dataset.e2eReloadMarker = "true";
  });
};

const hasPageMarker = async (page: Page): Promise<boolean> => {
  return await page.evaluate(
    () => document.body.dataset.e2eReloadMarker === "true",
  );
};

// Stop intercepting before the context closes so a poll still in flight
// can't fail an already finished test
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

test("Update banner appears once polls confirm a newer build and stays dismissed", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await reportServerBuildTime(page);

  // Mock browser timers so the data poll (dataUpdateInterval, 60 s) can be
  // fast-forwarded instead of waited for. Must be installed before the app loads
  await page.clock.install();
  await page.goto("/");
  const programList = new ProgramListPage(page);
  await expect(programList.programTypeFilter).toBeVisible();

  const banner = new AppUpdateBanner(page);

  // The load-time poll only makes the new version a candidate, so a rolling
  // deploy answering with mixed versions doesn't show the banner yet
  await expect(banner.container).toBeHidden();

  // The second poll confirms the version
  await page.clock.fastForward("01:01");
  await expect(banner.container).toBeVisible();
  await expect(banner.container).toContainText(/konsti has been updated/i);

  // Dismissing hides the banner, and later polls reporting the same version
  // don't bring it back
  await banner.dismissButton.click();
  await expect(banner.container).toBeHidden();
  await page.clock.fastForward("01:01");
  await expect(banner.container).toBeHidden();
});

test("A settings response with no build time at all is not an update", async ({
  page,
  request,
}) => {
  await clearDb(request);
  // A server deployed before the build time field existed answers without it
  await reportServerBuildTime(page, null);

  // Count the polls rather than assuming a fast forward produces one: the app
  // drops an interval tick that lands while a load is still running, and a
  // banner that never appears would otherwise pass for the wrong reason
  let settingsResponses = 0;
  page.on("response", (response) => {
    if (response.url().includes("/api/settings")) {
      settingsResponses += 1;
    }
  });

  await page.clock.install();
  await page.goto("/");
  const programList = new ProgramListPage(page);
  await expect(programList.programTypeFilter).toBeVisible();

  // The load-time response plus the two polls a version needs to be confirmed
  await expect
    .poll(async () => {
      await page.clock.fastForward("01:01");
      return settingsResponses;
    })
    .toBeGreaterThanOrEqual(3);

  const banner = new AppUpdateBanner(page);
  await expect(banner.container).toBeHidden();
});

test("An instance still on the previous build is not an update", async ({
  page,
  request,
}) => {
  await clearDb(request);
  // Mid-rollout this page came from an already-updated instance, and its polls
  // land on one that hasn't rolled yet: a different deploy, but an older build
  await reportServerBuildTime(page, "-1");

  let settingsResponses = 0;
  page.on("response", (response) => {
    if (response.url().includes("/api/settings")) {
      settingsResponses += 1;
    }
  });

  await page.clock.install();
  await page.goto("/");
  const programList = new ProgramListPage(page);
  await expect(programList.programTypeFilter).toBeVisible();

  await expect
    .poll(async () => {
      await page.clock.fastForward("01:01");
      return settingsResponses;
    })
    .toBeGreaterThanOrEqual(3);

  const banner = new AppUpdateBanner(page);
  await expect(banner.container).toBeHidden();
});

test("A further deploy notifies again after an earlier build was dismissed", async ({
  page,
  request,
}) => {
  await clearDb(request);
  const setServerBuildTime = await reportServerBuildTime(page, "1000");

  await page.clock.install();
  await page.goto("/");
  const programList = new ProgramListPage(page);
  await expect(programList.programTypeFilter).toBeVisible();

  const banner = new AppUpdateBanner(page);
  await page.clock.fastForward("01:01");
  await expect(banner.container).toBeVisible();

  await banner.dismissButton.click();
  await expect(banner.container).toBeHidden();

  // A dismissal only silences the build it was made for, so the next
  // deploy notifies again in the same tab
  setServerBuildTime("2000");
  // Keep advancing rather than counting ticks: the app drops an interval tick
  // that arrives while the previous load is still in flight, so the number of
  // fast-forwards needed to confirm a build is not fixed
  await expect
    .poll(async () => {
      await page.clock.fastForward("01:01");
      return await banner.container.isVisible();
    })
    .toBe(true);
});

test("A later build gets a transparent reload of its own", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime: "2026-07-24T15:00:00.000Z",
      endTime: "2026-07-24T19:00:00.000Z",
    },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  const setServerBuildTime = await reportServerBuildTime(page, "1000");

  await page.clock.install();
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.waitForItems();

  const banner = new AppUpdateBanner(page);
  await page.clock.fastForward("01:01");
  await expect(banner.container).toBeVisible();

  // Spend the guard on the first build
  await Promise.all([
    page.waitForEvent("load"),
    programList.firstItem().title.click(),
  ]);
  const programItemPage = new ProgramItemPage(page);
  await expect(programItemPage.title).toBeVisible();

  // The guard records the build it was spent on rather than that a reload has
  // happened at all, so a further deploy is still allowed one. This is what
  // makes a rollback work: it redeploys earlier code under a later build time
  setServerBuildTime("2000");
  await expect
    .poll(async () => {
      await page.clock.fastForward("01:01");
      return await banner.container.isVisible();
    })
    .toBe(true);

  await setPageMarker(page);
  await Promise.all([
    page.waitForEvent("load"),
    programItemPage.navigation.gotoProgram(),
  ]);
  expect(await hasPageMarker(page)).toBe(false);
});

test("Update banner reload button reloads the page", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await reportServerBuildTime(page);

  await page.clock.install();
  await page.goto("/");
  const programList = new ProgramListPage(page);
  await expect(programList.programTypeFilter).toBeVisible();

  const banner = new AppUpdateBanner(page);
  await page.clock.fastForward("01:01");
  await expect(banner.container).toBeVisible();

  await setPageMarker(page);
  await Promise.all([page.waitForEvent("load"), banner.reloadButton.click()]);
  expect(await hasPageMarker(page)).toBe(false);

  // The reloaded page starts clean: the banner returns only after the polls
  // confirm the version again
  await expect(banner.container).toBeHidden();
});

test("Update reloads transparently on the first navigation, but only once per build", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime: "2026-07-24T15:00:00.000Z",
      endTime: "2026-07-24T19:00:00.000Z",
    },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await reportServerBuildTime(page);

  await page.clock.install();
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.waitForItems();

  const banner = new AppUpdateBanner(page);
  await page.clock.fastForward("01:01");
  await expect(banner.container).toBeVisible();

  // A route navigation replaces the whole view, so the app uses it to apply
  // the update with a transparent full reload at the target route
  await setPageMarker(page);
  await Promise.all([
    page.waitForEvent("load"),
    programList.firstItem().title.click(),
  ]);
  expect(page.url()).toContain("/program/item/");
  expect(await hasPageMarker(page)).toBe(false);
  await expect(banner.container).toBeHidden();

  // The reloaded page confirms the still-differing version again. Wait for
  // the view to render first: it means the load-time poll has finished, so
  // the fast-forwarded interval tick isn't dropped as concurrent
  const programItemPage = new ProgramItemPage(page);
  await expect(programItemPage.title).toBeVisible();
  await page.clock.fastForward("01:01");
  await expect(banner.container).toBeVisible();

  // ...but the automatic reload is attempted only once per version: a
  // further link navigation is a normal SPA transition that keeps the page
  // instance and the banner. A link click rather than history back, because
  // traversing to an entry whose document the transparent reload destroyed
  // may be a cross-document load in some browsers
  await setPageMarker(page);
  // Watch for a load before navigating: asserting on the marker alone races
  // the reload, so it would hold even if one were on its way
  const reloaded = (async (): Promise<boolean> => {
    try {
      await page.waitForEvent("load", { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  })();
  await programItemPage.navigation.gotoProgram();
  await expect(page).toHaveURL(/\/program\/list/);
  expect(await reloaded).toBe(false);
  await expect(banner.container).toBeVisible();
  expect(await hasPageMarker(page)).toBe(true);
});
