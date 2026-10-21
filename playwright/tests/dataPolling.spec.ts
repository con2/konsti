import { Page, expect, test } from "@playwright/test";
import { addHours } from "date-fns";
import { config } from "shared/config";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { pauseClock } from "playwright/clockTestUtils";
import { setPageHidden } from "playwright/pageVisibilityUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  clearDb,
  login,
  populateDb,
  postTestSettings,
  signupsOpenTime,
} from "playwright/playwrightUtils";

const programType = config.event().twoPhaseSignupProgramTypes[0];
// Both program items start an hour into the event so they are upcoming at the
// event start time the tests run at
const programItemStartTime = addHours(
  new Date(signupsOpenTime()),
  1,
).toISOString();
const programItemEndTime = addHours(
  new Date(programItemStartTime),
  4,
).toISOString();
const initialProgramItem = {
  ...testProgramItem,
  title: "Initial program",
  programType,
  startTime: programItemStartTime,
  endTime: programItemEndTime,
};
const addedProgramItem = {
  ...testProgramItem2,
  title: "Added program",
  programType,
  startTime: programItemStartTime,
  endTime: programItemEndTime,
};

// Every data load starts by requesting the settings, so that request counts
// the loads
const countLoads = (page: Page): (() => number) => {
  let loads = 0;
  page.on("request", (pageRequest) => {
    if (
      pageRequest.method() === "GET" &&
      pageRequest.url().includes(ApiEndpoint.SETTINGS)
    ) {
      loads += 1;
    }
  });
  return () => loads;
};

// A load's first request is on the wire before the clock jump or visibility
// change that started it has returned control, so its request event only
// needs a moment of real time to arrive
const expectNoLoadStarted = async (
  page: Page,
  loads: () => number,
): Promise<void> => {
  await page.waitForTimeout(1000);
  expect(loads()).toBe(0);
};

test("Periodic data poll picks up new program items without navigation", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [initialProgramItem]);
  await postTestSettings(request, {
    testTime: signupsOpenTime(),
  });
  await login(page, request, { username: "test1", password: "test" });

  // Mock browser timers so the data poll (dataUpdateInterval, 60 s) can be
  // fast-forwarded instead of waited for. Must be installed before the app loads.
  await page.clock.install();
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await expect(
    programList.itemByTitle("Initial program").container,
  ).toHaveCount(1);

  // A program item added server-side is not shown yet...
  // saveProgramItems treats the posted list as the full program, so include both
  await addProgramItems(request, [initialProgramItem, addedProgramItem]);
  await expect(programList.itemByTitle("Added program").container).toHaveCount(
    0,
  );

  // ...until the periodic poll fires and refetches the data
  await page.clock.fastForward("01:01");
  await expect(programList.itemByTitle("Added program").container).toHaveCount(
    1,
  );
});

test("Periodic data poll hides sign-up when direct sign-up ends", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  const startTime = programItemStartTime;
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime,
      endTime: programItemEndTime,
    },
  ]);
  await postTestSettings(request, {
    testTime: signupsOpenTime(),
  });
  await login(page, request, { username: "test1", password: "test" });

  // Mock browser timers so the data poll (dataUpdateInterval, 60 s) can be
  // fast-forwarded instead of waited for. Must be installed before the app loads.
  await page.clock.install();
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();

  // Direct sign-up is open when the page loads
  const firstProgramItem = programList.firstItem();
  await expect(firstProgramItem.signUpButton).toBeVisible();

  // Move time past the program item's start on the background...
  await postTestSettings(request, {
    testTime: addHours(new Date(startTime), 1).toISOString(),
  });
  await expect(firstProgramItem.signUpButton).toBeVisible();

  // ...and the periodic poll picks up the change without navigation. A program
  // item whose direct sign-up has ended is no longer upcoming, so it drops out
  // of the default starting time filter entirely.
  await page.clock.fastForward("01:01");
  await expect(programList.items).toHaveCount(0);

  // It is still listed under All, now without any sign-up controls
  await programList.selectStartingTime("All");
  await expect(firstProgramItem.signUpButton).toBeHidden();
  await expect(firstProgramItem.container).not.toContainText("Sign-up closes");
});

test("Periodic data poll pauses while the page is hidden and refreshes on resume", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [initialProgramItem]);
  await postTestSettings(request, {
    testTime: signupsOpenTime(),
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.clock.install();
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await expect(
    programList.itemByTitle("Initial program").container,
  ).toHaveCount(1);
  await pauseClock(page);

  await setPageHidden(page, true);
  const loadsSinceHidden = countLoads(page);
  await addProgramItems(request, [initialProgramItem, addedProgramItem]);

  // The poll tick that would have picked the item up is skipped while hidden
  await page.clock.fastForward("01:01");
  await expectNoLoadStarted(page, loadsSinceHidden);
  await expect(programList.itemByTitle("Added program").container).toHaveCount(
    0,
  );

  // Showing the page again refreshes the data it missed
  await setPageHidden(page, false);
  await expect(programList.itemByTitle("Added program").container).toHaveCount(
    1,
  );
  expect(loadsSinceHidden()).toBe(1);
});

test("Periodic data poll does not refresh on resume while its data is fresh", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [initialProgramItem]);
  await postTestSettings(request, {
    testTime: signupsOpenTime(),
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.clock.install();
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await expect(
    programList.itemByTitle("Initial program").container,
  ).toHaveCount(1);
  await pauseClock(page);

  await setPageHidden(page, true);
  const loadsSinceHidden = countLoads(page);
  await addProgramItems(request, [initialProgramItem, addedProgramItem]);

  // Hidden for less than a poll interval, so the data is still fresh when
  // the page is shown again and plain tab switching causes no request. The
  // hide is short enough that the real time the app took to boot before the
  // clock was paused cannot push the next tick inside it
  await page.clock.fastForward("00:10");
  await setPageHidden(page, false);
  await expectNoLoadStarted(page, loadsSinceHidden);

  // The regular tick then delivers the change
  await page.clock.fastForward("00:51");
  await expect(programList.itemByTitle("Added program").container).toHaveCount(
    1,
  );
  expect(loadsSinceHidden()).toBe(1);
});
