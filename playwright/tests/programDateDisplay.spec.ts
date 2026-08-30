import { TZDate } from "@date-fns/tz";
import { APIRequestContext, expect, test } from "@playwright/test";
import { addHours, subDays, subWeeks } from "date-fns";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { Tag } from "shared/types/models/programItem";
import { TIMEZONE } from "shared/utils/timezone";
import { ProgramItemPage } from "playwright/pages/ProgramItemPage";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  clearDb,
  login,
  populateDb,
  postTestSettings,
} from "playwright/playwrightUtils";

// Program times show the weekday only during event week; further out the
// weekday alone is ambiguous, so the full date must be included. The times are
// asserted by shape rather than value: the event decides which weekday and hour
// the program items land on.
const fullDatePattern = /^\w{3} \d{1,2}\.\d{1,2}\.\d{4} \d{2}:\d{2}$/;
const weekdayPattern = /^\w+ \d{2}:\d{2}$/;

const programType = config.event().twoPhaseSignupProgramTypes[0];
const eventStart = new Date(config.event().eventStartTime);
// Offsets from the event start keep both program items on the same weekdays
// whatever timezone the test runs in
const preWeekStart = subDays(eventStart, 4);
const mainEventStart = addHours(eventStart, 3);

const preWeekProgramItem = {
  ...testProgramItem,
  title: "Pre-week program",
  tags: [Tag.PRE_CONVENTION_WEEK],
  programType,
  startTime: preWeekStart.toISOString(),
  endTime: addHours(preWeekStart, 4).toISOString(),
};
const mainEventProgramItem = {
  ...testProgramItem2,
  title: "Main event program",
  programType,
  startTime: mainEventStart.toISOString(),
  endTime: addHours(mainEventStart, 4).toISOString(),
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
    testTime: subWeeks(
      new Date(config.event().eventStartTime),
      3,
    ).toISOString(),
  });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.selectStartingTime("All");

  const heading = programList.timeHeadings.first();
  await expect(heading).toHaveText(fullDatePattern);
  const headingText = await heading.textContent();

  await programList.itemByTitle("Pre-week program").title.click();

  const programItem = new ProgramItemPage(page);
  await expect(programItem.timeRow).toContainText(`${headingText} – `);
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

  const heading = programList.timeHeadings.first();
  await expect(heading).toHaveText(weekdayPattern);
  const headingText = await heading.textContent();

  await programList.itemByTitle("Main event program").title.click();

  const programItem = new ProgramItemPage(page);
  await expect(programItem.timeRow).toContainText(`${headingText} – `);
  await expect(programItem.timeRow).not.toContainText(
    String(new TZDate(mainEventStart, TIMEZONE).getFullYear()),
  );
});
