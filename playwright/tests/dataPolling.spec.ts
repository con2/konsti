import { Page, expect, test } from "@playwright/test";
import { addHours } from "date-fns";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  endTimeFor,
  hoursIntoEvent,
  signupsOpenTime,
  twoPhaseProgramItem,
} from "shared/tests/programItemFixtures";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { PAST_POLL_TICK, pauseClock } from "playwright/clockTestUtils";
import { setPageHidden } from "playwright/pageVisibilityUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  login,
  populateDb,
  postTestSettings,
} from "playwright/playwrightUtils";

// Both program items start an hour into the event so they are upcoming at the
// event start time the tests run at
const programItemStartTime = hoursIntoEvent(1);
const initialProgramItem = twoPhaseProgramItem(programItemStartTime, {
  title: "Initial program",
});
const addedProgramItem = twoPhaseProgramItem(programItemStartTime, {
  programItem: testProgramItem2,
  title: "Added program",
});

interface LoadCounter {
  loads: () => number;
  reset: () => void;
}

// Every data load starts by requesting the settings, so that request counts
// the loads
const settingsPath: string = ApiEndpoint.SETTINGS;

const countLoads = (page: Page): LoadCounter => {
  let loads = 0;
  page.on("request", (pageRequest) => {
    if (
      pageRequest.method() === "GET" &&
      new URL(pageRequest.url()).pathname === settingsPath
    ) {
      loads += 1;
    }
  });
  return {
    loads: () => loads,
    reset: () => {
      loads = 0;
    },
  };
};

// A load's first request is on the wire before the clock jump or visibility
// change that started it has returned control, so a waiter registered after
// it would miss it. Proving no load started therefore gives the request event
// a moment of real time instead.
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
  await page.clock.fastForward(PAST_POLL_TICK);
  await expect(programList.itemByTitle("Added program").container).toHaveCount(
    1,
  );
});

test("Periodic data poll hides sign-up when direct sign-up ends", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  const startTime = programItemStartTime;
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime,
      endTime: endTimeFor(startTime),
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
  await page.clock.fastForward(PAST_POLL_TICK);
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
  const loadCounter = countLoads(page);
  await addProgramItems(request, [initialProgramItem, addedProgramItem]);

  // The poll tick that would have picked the item up is skipped while hidden
  await page.clock.fastForward(PAST_POLL_TICK);
  await expectNoLoadStarted(page, loadCounter.loads);
  await expect(programList.itemByTitle("Added program").container).toHaveCount(
    0,
  );

  // Showing the page again refreshes the data it missed
  await setPageHidden(page, false);
  await expect(programList.itemByTitle("Added program").container).toHaveCount(
    1,
  );
  expect(loadCounter.loads()).toBe(1);
});

test("Periodic data poll does not refresh on resume while its data is fresh", async ({
  page,
  request,
}) => {
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

  // Force a resume refresh first so the last load and the next tick sit at
  // known mocked-clock instants, not where the real boot time left them
  const loadCounter = countLoads(page);
  await setPageHidden(page, true);
  await addProgramItems(request, [initialProgramItem, addedProgramItem]);
  await page.clock.fastForward(PAST_POLL_TICK);
  await setPageHidden(page, false);
  // The program items request is a groupless user's last, so this means the
  // load is done
  await expect(programList.itemByTitle("Added program").container).toHaveCount(
    1,
  );
  expect(loadCounter.loads()).toBe(1);

  // Hidden for less than a poll interval, so the data is still fresh when
  // the page is shown again and plain tab switching causes no request
  loadCounter.reset();
  await setPageHidden(page, true);
  await page.clock.fastForward("00:10");
  await setPageHidden(page, false);
  await expectNoLoadStarted(page, loadCounter.loads);

  // The regular tick, a full interval after the resume refresh, loads again
  await page.clock.fastForward("00:51");
  await expect.poll(loadCounter.loads).toBe(1);
});
