import { TZDate } from "@date-fns/tz";
import { expect, test } from "@playwright/test";
import { config } from "shared/config";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
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
  hoursIntoEvent,
  login,
  populateDb,
  postAssignment,
  postSettings,
  postTestSettings,
  testPostDirectSignup,
  testPostLotterySignup,
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

test("Show event log notification when program item with direct sign-up is moved", async ({
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
// exists at that time.
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
// the program item moved rather than losing the sign-up.
test("Keep a placed direct sign-up and say the starting time changed", async ({
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

// An organiser can create the one conflict the sign-up guards can't prevent: moving a program
// item the attendee holds a spot in onto a time they have lottery sign-ups for. Nothing is
// cancelled - they didn't cause it, and a lottery sign-up can't be re-added once its window
// shuts. The spot doesn't keep them out of that lottery either, whoever gave it to them: they
// take part, and what the lottery gives them takes the place of the spot they held.
test("Keep lottery sign-ups a moved program item landed on and act on them", async ({
  page,
  request,
}) => {
  const lotteryStartTime = hoursIntoEvent(3);
  const heldStartTime = hoursIntoEvent(1);

  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });

  const lotteryProgramItem = {
    ...testProgramItem,
    programType: config.event().twoPhaseSignupProgramTypes[0],
    startTime: lotteryStartTime,
    // Placeable with the single attendee this test signs up
    minAttendance: 1,
  };
  // 'Sign-up always open', so the attendee can hold a spot in it before any lottery has run
  const heldProgramItem = {
    ...testProgramItem2,
    programType: config.event().twoPhaseSignupProgramTypes[0],
    tags: [Tag.PRE_CONVENTION_WEEK],
    startTime: heldStartTime,
  };

  await addProgramItems(request, [lotteryProgramItem, heldProgramItem]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  await testPostDirectSignup(request, "test1", {
    directSignupProgramItemId: testProgramItem2.programItemId,
    message: "",
  });
  await testPostLotterySignup(request, "test1", {
    programItemId: testProgramItem.programItemId,
    priority: 1,
  });

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  // The held program item moves on top of the lottery sign-up's start time. Both items are
  // posted, since the endpoint takes the whole program list.
  await addProgramItems(request, [
    lotteryProgramItem,
    { ...heldProgramItem, startTime: lotteryStartTime },
  ]);

  await page.reload();

  const programList = new ProgramListPage(page);
  await expect(
    programList.notificationBar.bar.filter({
      hasText: "starting time has changed",
    }),
  ).toBeVisible();

  // The lottery sign-up is kept rather than cancelled
  await programList.gotoMyProgram();
  await expect(programList.lotterySignupList).toContainText(
    testProgramItem.title,
  );

  // ...and the lottery acts on it, replacing the spot the moved program item brought along
  await postAssignment(request, lotteryStartTime);
  await page.reload();
  await programList.gotoMyProgram();

  await expect(programList.directSignupList).toContainText(
    testProgramItem.title,
  );
  await expect(programList.directSignupList).not.toContainText(
    testProgramItem2.title,
  );
});

test("Offer direct sign-up instead of a lottery for a program item moved after its lottery", async ({
  page,
  request,
}) => {
  const lotteryStartTime = hoursIntoEvent(3);
  const movedStartTime = hoursIntoEvent(5);

  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });

  const programItem = {
    ...testProgramItem,
    programType: config.event().twoPhaseSignupProgramTypes[0],
    startTime: lotteryStartTime,
  };
  await addProgramItems(request, [programItem]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  await testPostLotterySignup(request, "test1", {
    programItemId: testProgramItem.programItemId,
    priority: 1,
  });
  await postAssignment(request, lotteryStartTime);

  // Moved to a slot whose lottery has not run. Its lottery already happened, so the spots it
  // has left are first come, first served rather than lotteried a second time.
  await addProgramItems(request, [
    { ...programItem, startTime: movedStartTime },
  ]);

  // Two hours in, the moved program item's own lottery sign-up window would be open: it starts
  // at hour 5, and a lottery runs from four to two hours before that. Without the one-lottery
  // rule this is exactly when it would offer a second one.
  await postTestSettings(request, { testTime: hoursIntoEvent(2) });

  await login(page, request, { username: "test2", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();

  const movedProgramItem = programList.itemByTitle(testProgramItem.title);
  await expect(movedProgramItem.lotterySignupButton).toBeHidden();
  await expect(movedProgramItem.container).toContainText(
    "This program item is not in another lottery because its starting time changed after its lottery.",
  );
  // Direct sign-up opened right after its lottery and does not shut again: the new slot's own
  // schedule would not reach it until hour 3:15
  await expect(movedProgramItem.signUpButton).toBeVisible();
  await expect(movedProgramItem.container).toContainText("Sign-up closes");
  await expect(movedProgramItem.container).not.toContainText("Sign-up opens");

  // Ends on the program item's own page so a headed run leaves this state on screen
  await movedProgramItem.title.click();

  const programItemPage = new ProgramItemPage(page);
  await expect(programItemPage.main).toContainText(
    "This program item is not in another lottery because its starting time changed after its lottery.",
  );
  await expect(programItemPage.main).toContainText("Sign-up closes");
});
