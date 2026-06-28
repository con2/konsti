import { test, expect, APIRequestContext } from "@playwright/test";
import dayjs from "dayjs";
import {
  postTestSettings,
  login,
  addProgramItems,
  clearDb,
  populateDb,
} from "playwright/playwrightUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { config } from "shared/config";
import { Tag } from "shared/types/models/programItem";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";

const programType = config.event().twoPhaseSignupProgramTypes[0];
// Pre-convention week program takes place before the main event starts
const preWeekProgramItem = {
  ...testProgramItem,
  title: "Pre-week program",
  tags: [Tag.PRE_CONVENTION_WEEK],
  programType,
  startTime: "2026-07-20T15:00:00.000Z",
  endTime: "2026-07-20T19:00:00.000Z",
};
const mainEventProgramItem = {
  ...testProgramItem2,
  title: "Main event program",
  programType,
  startTime: "2026-07-24T15:00:00.000Z",
  endTime: "2026-07-24T19:00:00.000Z",
};

const seed = async (request: APIRequestContext): Promise<void> => {
  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [preWeekProgramItem, mainEventProgramItem]);
};

test("Before main event program is visible, only pre-convention week program is shown", async ({
  page,
  request,
}) => {
  await seed(request);
  await postTestSettings(request, {
    testTime: dayjs(config.event().mainEventProgramVisibleTime)
      .subtract(1, "day")
      .toISOString(),
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
  await seed(request);
  await postTestSettings(request, {
    testTime: dayjs(config.event().mainEventProgramVisibleTime)
      .add(1, "hour")
      .toISOString(),
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
