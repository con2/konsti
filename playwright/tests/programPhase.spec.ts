import { expect, test } from "@playwright/test";
import { addHours, subDays } from "date-fns";
import { config } from "shared/config";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  login,
  postTestSettings,
  signupsOpenTime,
} from "playwright/playwrightUtils";
import { seedProgramPhases } from "playwright/programPhaseFixtures";

test.skip(
  !config.event().mainEventProgramVisibleTime,
  "Event shows all program from the start, so there is no program phase to test",
);

// Every test here is skipped above when this is unset, so the fallback is never
// the value actually used
const mainEventProgramVisibleTime = new Date(
  config.event().mainEventProgramVisibleTime ?? 0,
);

// The pre-convention week program is over before the main event program becomes visible,
// and the main event program starts after it has
const programPhaseTimes = {
  preWeekStart: subDays(mainEventProgramVisibleTime, 1),
  mainEventStart: addHours(new Date(signupsOpenTime()), 3),
};

test("Before main event program is visible, only pre-convention week program is shown", async ({
  page,
  request,
}) => {
  await seedProgramPhases(request, programPhaseTimes);
  await postTestSettings(request, {
    testTime: subDays(mainEventProgramVisibleTime, 1).toISOString(),
  });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");
  await programList.selectStartingTime("All");

  await expect(
    programList.itemByTitle("Pre-week program").container,
  ).toHaveCount(1);
  await expect(
    programList.itemByTitle("Main event program").container,
  ).toHaveCount(0);
});

test("After main event program is visible, main event program is shown and pre-convention week is not upcoming", async ({
  page,
  request,
}) => {
  await seedProgramPhases(request, programPhaseTimes);
  await postTestSettings(request, {
    testTime: addHours(mainEventProgramVisibleTime, 1).toISOString(),
  });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");

  // All program is visible now
  await programList.selectStartingTime("All");
  await expect(
    programList.itemByTitle("Pre-week program").container,
  ).toHaveCount(1);
  await expect(
    programList.itemByTitle("Main event program").container,
  ).toHaveCount(1);

  // Pre-convention week program is no longer shown in the upcoming list
  await programList.selectStartingTime("Upcoming");
  await expect(
    programList.itemByTitle("Main event program").container,
  ).toHaveCount(1);
  await expect(
    programList.itemByTitle("Pre-week program").container,
  ).toHaveCount(0);
});
