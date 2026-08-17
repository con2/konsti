import { APIRequestContext, expect, test } from "@playwright/test";
import dayjs from "dayjs";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { Tag } from "shared/types/models/programItem";
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
// the program items land on
const fullDatePattern = /^\w{3} \d{1,2}\.\d{1,2}\.\d{4} \d{2}:\d{2}$/;
const weekdayPattern = /^\w+ \d{2}:\d{2}$/;

const programType = config.event().twoPhaseSignupProgramTypes[0];
const eventStart = dayjs(config.event().eventStartTime);
// Offsets from the event start keep both program items on the same weekdays
// whatever timezone the test runs in
const preWeekStart = eventStart.subtract(4, "days");
const mainEventStart = eventStart.add(3, "hours");

const preWeekProgramItem = {
  ...testProgramItem,
  title: "Pre-week program",
  tags: [Tag.PRE_CONVENTION_WEEK],
  programType,
  startTime: preWeekStart.toISOString(),
  endTime: preWeekStart.add(4, "hours").toISOString(),
};
const mainEventProgramItem = {
  ...testProgramItem2,
  title: "Main event program",
  programType,
  startTime: mainEventStart.toISOString(),
  endTime: mainEventStart.add(4, "hours").toISOString(),
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
    mainEventStart.format("YYYY"),
  );
});
