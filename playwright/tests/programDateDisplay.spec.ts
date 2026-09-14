import { TZDate } from "@date-fns/tz";
import { expect, test } from "@playwright/test";
import { addHours, subDays, subWeeks } from "date-fns";
import { TIMEZONE } from "shared/utils/timezone";
import { ProgramItemPage } from "playwright/pages/ProgramItemPage";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  login,
  postTestSettings,
  signupsOpenTime,
} from "playwright/playwrightUtils";
import { seedProgramPhases } from "playwright/programPhaseFixtures";

// Program times show the weekday only during event week; further out the
// weekday alone is ambiguous, so the full date must be included. The times are
// asserted by shape rather than value: the event decides which weekday and hour
// the program items land on.
const fullDatePattern = /^\w{3} \d{1,2}\.\d{1,2}\.\d{4} \d{2}:\d{2}$/;
const weekdayPattern = /^\w+ \d{2}:\d{2}$/;

const eventStart = new Date(signupsOpenTime());
// Offsets from the event start keep both program items on the same weekdays
// whatever timezone the test runs in
const mainEventStart = addHours(eventStart, 3);
const programPhaseTimes = {
  preWeekStart: subDays(eventStart, 4),
  mainEventStart,
};

test("Before event week, program times include the full date", async ({
  page,
  request,
}) => {
  await seedProgramPhases(request, programPhaseTimes);
  await postTestSettings(request, {
    testTime: subWeeks(new Date(signupsOpenTime()), 3).toISOString(),
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
  await seedProgramPhases(request, programPhaseTimes);
  await postTestSettings(request, {
    testTime: signupsOpenTime(),
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
