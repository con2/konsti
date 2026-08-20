import { expect, test } from "@playwright/test";
import { addHours, startOfHour } from "date-fns";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { AppUpdateBanner } from "playwright/pages/AppUpdateBanner";
import { BasePage } from "playwright/pages/BasePage";
import { ErrorBar } from "playwright/pages/ErrorBar";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  clearDb,
  login,
  populateDb,
  postSettings,
  postTestSettings,
  reportServerBuildTime,
} from "playwright/playwrightUtils";

// Program item starts an hour into the event so it is upcoming at the event
// start time the tests run at
const programItemStartTime = addHours(
  new Date(config.event().eventStartTime),
  1,
).toISOString();

// Layout of the bars the app stacks below the header. Each bar's own behaviour
// is covered where that feature lives; these cover how they sit together

// Stop intercepting before the context closes so a poll still in flight
// can't fail an already finished test
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

test("Update banner and admin message stack instead of overlapping when scrolled", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  const startTime = startOfHour(
    addHours(new Date(config.event().eventStartTime), 1),
  ).toISOString();
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
  await reportServerBuildTime(page);

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
      startTime: programItemStartTime,
      endTime: addHours(new Date(programItemStartTime), 4).toISOString(),
    },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await postSettings(request, {
    adminMessageEn: "Admin message for the alignment test",
    adminMessageFi: "Yllapidon viesti",
  });

  await reportServerBuildTime(page);

  // Signing in also brings up the first login notice, the fourth bar
  await login(page, request, { username: "test1", password: "test" });
  await page.clock.install();
  await page.goto("/");

  // Signed in the app opens on My Program, so wait for the notice rather
  // than for program item cards
  const programList = new ProgramListPage(page);
  await expect(programList.firstLoginNotice).toBeVisible();

  // Keep advancing rather than counting ticks: the app drops an interval tick
  // that arrives while the previous load is still in flight, and the notice
  // renders before that load has finished
  const banner = new AppUpdateBanner(page);
  await expect
    .poll(async () => {
      await page.clock.fastForward("01:01");
      return await banner.container.isVisible();
    })
    .toBe(true);
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
