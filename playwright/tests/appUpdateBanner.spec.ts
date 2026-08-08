import { test, expect, Page } from "@playwright/test";
import dayjs from "dayjs";
import {
  addProgramItems,
  clearDb,
  login,
  populateDb,
  postSettings,
  postTestSettings,
} from "playwright/playwrightUtils";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { AppUpdateBanner } from "playwright/pages/AppUpdateBanner";
import { BasePage } from "playwright/pages/BasePage";
import { ErrorBar } from "playwright/pages/ErrorBar";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { ProgramItemPage } from "playwright/pages/ProgramItemPage";

// The banner compares the version the server reports in the polled settings
// response against the version baked into the client bundle (a fixed
// placeholder in development and ci builds). The test server reports an empty
// version, so patch the settings responses to simulate a new deploy. Returns
// a setter so a test can simulate a further deploy mid-run
const reportServerVersion = async (
  page: Page,
  version: string,
): Promise<(nextVersion: string) => void> => {
  let reportedVersion = version;
  await page.route("**/api/settings", async (route) => {
    try {
      const response = await route.fetch();
      const json = (await response.json()) as { appVersion: string };
      json.appVersion = reportedVersion;
      await route.fulfill({ response, json });
    } catch {
      // The mocked clock can leave a poll in flight when the test ends, and
      // closing the context disposes the response while this handler is
      // still reading it. Nothing depends on the patched body by then
    }
  });
  return (nextVersion: string): void => {
    reportedVersion = nextVersion;
  };
};

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

test("Update banner and admin message stack instead of overlapping when scrolled", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  const startTime = dayjs(config.event().eventStartTime)
    .add(1, "hour")
    .startOf("hour")
    .toISOString();
  // Enough items that the page scrolls, so the sticky bars actually pin
  await addProgramItems(
    request,
    Array.from({ length: 20 }, (_, index) => ({
      ...testProgramItem,
      programItemId: `stacking-item-${index}`,
      title: `Stacking test item ${index}`,
      startTime,
    })),
  );
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await postSettings(request, {
    adminMessageEn: "Admin message for the stacking test",
    adminMessageFi: "Yllapidon viesti",
  });
  await reportServerVersion(page, "e2e-new-version");

  await page.clock.install();
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.waitForItems();

  const banner = new AppUpdateBanner(page);
  await page.clock.fastForward("01:01");
  await expect(banner.container).toBeVisible();
  await expect(programList.adminMessageBanner).toBeVisible();

  // Pin the bars: sibling stickies sharing a top offset would collapse onto
  // each other here, hiding whichever paints first
  // scrollBy rather than mouse.wheel: mobile WebKit has no wheel support.
  // Sticky positioning is pure CSS, so the late scroll event WebKit delivers
  // for programmatic scrolls doesn't matter here
  await page.evaluate(() => {
    window.scrollBy(0, 600);
  });
  await expect
    .poll(async () => await page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);

  const updateBox = await banner.container.boundingBox();
  const adminBox = await programList.adminMessageBanner.boundingBox();
  expect(updateBox).not.toBeNull();
  expect(adminBox).not.toBeNull();

  // Both stay fully visible, one below the other. NaN fallbacks keep a
  // missing box from passing the comparison
  const updateBottom = (updateBox?.y ?? NaN) + (updateBox?.height ?? NaN);
  expect(updateBottom).toBeLessThanOrEqual((adminBox?.y ?? NaN) + 1);
});

test("App level bars line up with each other", async ({ page, request }) => {
  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime: "2026-07-24T15:00:00.000Z",
      endTime: "2026-07-24T19:00:00.000Z",
    },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await postSettings(request, {
    adminMessageEn: "Admin message for the alignment test",
    adminMessageFi: "Yllapidon viesti",
  });

  await reportServerVersion(page, "e2e-new-version");

  // Signing in also brings up the first login notice, the fourth bar
  await login(page, request, { username: "test1", password: "test" });
  await page.clock.install();
  await page.goto("/");

  // Signed in the app opens on My Program, so wait for the notice rather
  // than for program item cards
  const programList = new ProgramListPage(page);
  await expect(page.getByTestId("first-login-notice")).toBeVisible();

  const banner = new AppUpdateBanner(page);
  await page.clock.fastForward("01:01");
  await expect(banner.container).toBeVisible();
  await expect(programList.adminMessageBanner).toBeVisible();

  // Break the data poll so the network error toast joins the two banners
  await page.route("**/api/program-items**", async (route) => {
    await route.abort();
  });
  await page.clock.fastForward("01:01");
  await expect
    .poll(async () => {
      await page.clock.fastForward("00:05");
      return await programList.errorBar.items.first().isVisible();
    })
    .toBe(true);

  // The bars are separate components, so their dismiss icons drift apart
  // whenever one of them changes its box metrics. The testids come from the
  // page objects that own them rather than being repeated here
  const dismissIcons = await page.evaluate(
    (ids) =>
      ids.map((id) => {
        const bar = document.querySelector(`[data-testid="${CSS.escape(id)}"]`);
        // The leading icon isn't in a button, so this only matches the dismiss
        // one; the update banner's reload button carries text rather than an icon
        const dismissIcon = bar?.querySelector("button svg");
        if (!bar || !dismissIcon) {
          return null;
        }
        const barBox = bar.getBoundingClientRect();
        const iconBox = dismissIcon.getBoundingClientRect();
        return {
          right: Math.round(iconBox.right),
          // Distance from the bar's vertical middle, so a taller bar doesn't
          // change what counts as centred
          offsetFromMiddle: Math.round(
            iconBox.top + iconBox.height / 2 - (barBox.top + barBox.height / 2),
          ),
        };
      }),
    [
      ErrorBar.testId,
      AppUpdateBanner.testId,
      BasePage.adminMessageBannerTestId,
      BasePage.firstLoginNoticeTestId,
    ],
  );

  expect(dismissIcons[0]).not.toBeNull();
  expect(dismissIcons.map((icon) => icon?.right)).toEqual(
    Array.from({ length: dismissIcons.length }, () => dismissIcons[0]?.right),
  );

  // Every dismiss icon sits vertically centred in its bar, including the ones
  // whose message wraps onto several lines
  for (const icon of dismissIcons) {
    expect(Math.abs(icon?.offsetFromMiddle ?? Infinity)).toBeLessThanOrEqual(1);
  }
});
