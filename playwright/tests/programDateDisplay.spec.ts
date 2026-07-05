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
import { ProgramItemPage } from "playwright/pages/ProgramItemPage";
import { config } from "shared/config";
import { Tag } from "shared/types/models/programItem";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";

// Program times show the weekday only during event week; further out the
// weekday alone is ambiguous, so the full date must be included
const programType = config.event().twoPhaseSignupProgramTypes[0];
const preWeekProgramItem = {
  ...testProgramItem,
  title: "Pre-week program",
  tags: [Tag.PRE_CONVENTION_WEEK],
  programType,
  // Mon 20.7. 18:00–22:00 GMT+3
  startTime: "2026-07-20T15:00:00.000Z",
  endTime: "2026-07-20T19:00:00.000Z",
};
const mainEventProgramItem = {
  ...testProgramItem2,
  title: "Main event program",
  programType,
  // Fri 24.7. 18:00–22:00 GMT+3
  startTime: "2026-07-24T15:00:00.000Z",
  endTime: "2026-07-24T19:00:00.000Z",
};

const seed = async (request: APIRequestContext): Promise<void> => {
  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [preWeekProgramItem, mainEventProgramItem]);
};

test("Before event week, program times include the full date", async ({
  page,
  request,
}) => {
  await seed(request);
  await postTestSettings(request, {
    testTime: dayjs(config.event().eventStartTime)
      .subtract(3, "weeks")
      .toISOString(),
  });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");
  await programList.selectStartingTime("All");

  await expect(programList.timeHeadings.first()).toHaveText(
    "Mon 20.7.2026 18:00",
  );

  await programList.itemByTitle("Pre-week program").title.click();

  const programItem = new ProgramItemPage(page);
  await expect(programItem.timeRow).toContainText(
    "Mon 20.7.2026 18:00 – 22:00",
  );
});

test("During event week, program times show the weekday without a date", async ({
  page,
  request,
}) => {
  await seed(request);
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");

  await expect(programList.timeHeadings.first()).toHaveText("Friday 18:00");

  await programList.itemByTitle("Main event program").title.click();

  const programItem = new ProgramItemPage(page);
  await expect(programItem.timeRow).toContainText("Friday 18:00 – 22:00");
  await expect(programItem.timeRow).not.toContainText("2026");
});
