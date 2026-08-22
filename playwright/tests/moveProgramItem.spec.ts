import { TZDate } from "@date-fns/tz";
import { expect, test } from "@playwright/test";
import { config } from "shared/config";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { testProgramItem } from "shared/tests/testProgramItem";
import { TIMEZONE } from "shared/utils/timezone";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  clearDb,
  hoursIntoEvent,
  login,
  populateDb,
  postSettings,
  postTestSettings,
} from "playwright/playwrightUtils";

// The wall clock the app renders a time at, built here rather than taken from
// the formatters the app itself uses, so the assertions below are about which
// instant is shown rather than about how it is formatted
const clockTime = (isoTime: string): string => {
  const zoned = new TZDate(isoTime, TIMEZONE);
  const hours = String(zoned.getHours()).padStart(2, "0");
  const minutes = String(zoned.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

test("Show event log notification when program item with direct signup is moved", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
  });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime: hoursIntoEvent(1),
    },
  ]);

  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);

  // Navigate to program list tab and select RPG program type
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");

  // Direct sign-up to first program item
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  await firstProgramItem.signUp();
  await firstProgramItem.confirm();

  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");

  // Change program item state on background
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime: hoursIntoEvent(2),
    },
  ]);

  await page.reload();

  await expect(programList.notificationBar.bar).toContainText(
    "Role-playing game Test program item starting time has changed",
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    "Role-playing game Test program item starting time has changed",
  );
});

// A sign-up is made against a start time, and the lottery is run per start time.
// An upcoming lottery sign-up is therefore dropped when the item moves - the
// user has not been placed yet, and the seat they were queuing for no longer
// exists at that time
test("Remove an upcoming lottery sign-up when the program item moves", async ({
  page,
  request,
}) => {
  const lotteryProgramItem = {
    ...testProgramItem,
    programType: config.event().twoPhaseSignupProgramTypes[0],
  };

  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    { ...lotteryProgramItem, startTime: hoursIntoEvent(3) },
  ]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();

  const firstProgramItem = programList.firstItem();
  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirmLotterySignup();

  await programList.gotoMyProgram();
  await expect(programList.lotterySignupTimeHeadings.first()).toContainText(
    clockTime(hoursIntoEvent(3)),
  );

  await addProgramItems(request, [
    { ...lotteryProgramItem, startTime: hoursIntoEvent(5) },
  ]);
  await page.reload();
  await programList.gotoMyProgram();

  await expect(programList.lotterySignupList).toContainText(
    "No lottery sign-ups for upcoming program items",
  );
});

// A sign-up that has already been placed is kept instead: it holds a seat at the
// time it was made for, which is what the lottery ran against. The user is told
// the program item moved rather than losing the sign-up
test("Keep a placed sign-up and say the starting time changed", async ({
  page,
  request,
}) => {
  const signedToStartTime = hoursIntoEvent(1);
  const movedStartTime = hoursIntoEvent(2);

  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    { ...testProgramItem, startTime: signedToStartTime },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");
  await programList.waitForItems();

  const firstProgramItem = programList.firstItem();
  await firstProgramItem.signUp();
  await firstProgramItem.confirm();
  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");

  await addProgramItems(request, [
    { ...testProgramItem, startTime: movedStartTime },
  ]);
  await page.reload();
  await programList.gotoMyProgram();

  // The sign-up is still there, and the warning names both times: the one the
  // user holds a seat at, and the one the program item now runs at
  await expect(programList.directSignupList).toContainText(
    "Starting time changed",
  );
  await expect(programList.directSignupList).toContainText(
    clockTime(signedToStartTime),
  );
  await expect(programList.directSignupList).toContainText(
    clockTime(movedStartTime),
  );
});
