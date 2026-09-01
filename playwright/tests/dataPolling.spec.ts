import { expect, test } from "@playwright/test";
import { addHours } from "date-fns";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
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
