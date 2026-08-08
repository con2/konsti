import { test, expect, Page } from "@playwright/test";
import {
  addProgramItems,
  clearDb,
  populateDb,
  postTestSettings,
  reportServerVersion,
} from "playwright/playwrightUtils";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { AppUpdateBanner } from "playwright/pages/AppUpdateBanner";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { ProgramItemPage } from "playwright/pages/ProgramItemPage";

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

test("Update banner appears once polls confirm a new version and stays dismissed", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await reportServerVersion(page, "e2e-new-version");

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

test("A further deploy notifies again after an earlier version was dismissed", async ({
  page,
  request,
}) => {
  await clearDb(request);
  const setServerVersion = await reportServerVersion(page, "e2e-version-2");

  await page.clock.install();
  await page.goto("/");
  const programList = new ProgramListPage(page);
  await expect(programList.programTypeFilter).toBeVisible();

  const banner = new AppUpdateBanner(page);
  await page.clock.fastForward("01:01");
  await expect(banner.container).toBeVisible();

  await banner.dismissButton.click();
  await expect(banner.container).toBeHidden();

  // A dismissal only silences the version it was made for, so the next
  // deploy notifies again in the same tab
  setServerVersion("e2e-version-3");
  // Keep advancing rather than counting ticks: the app drops an interval tick
  // that arrives while the previous load is still in flight, so the number of
  // fast-forwards needed to confirm a version is not fixed
  await expect
    .poll(async () => {
      await page.clock.fastForward("01:01");
      return await banner.container.isVisible();
    })
    .toBe(true);
});

test("Update banner reload button reloads the page", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await reportServerVersion(page, "e2e-new-version");

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

test("Update reloads transparently on the first navigation, but only once per version", async ({
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
  await reportServerVersion(page, "e2e-new-version");

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
  await programItemPage.navigation.gotoProgram();
  await expect(page).toHaveURL(/\/program\/list/);
  await expect(banner.container).toBeVisible();
  expect(await hasPageMarker(page)).toBe(true);
});
