import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  postSettings,
  postTestSettings,
  login,
  addProgramItems,
  populateDb,
  postAssignment,
  testPostLotterySignup,
} from "playwright/playwrightUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";

test("Add lottery signup", async ({ page, request }) => {
  const startTime = dayjs(config.event().eventStartTime)
    .add(3, "hour")
    .startOf("hour")
    .toISOString();
  const endTime = dayjs(startTime)
    .add(testProgramItem.mins, "minutes")
    .toISOString();

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      endTime,
    },
  ]);

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);

  // Navigate to program list tab
  await programList.gotoAllProgram();

  // Lottery signup to first program item
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  const lotterySignupProgramItemTitle =
    await firstProgramItem.title.textContent();

  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirmLotterySignup();

  // Go to My Program and check lottery signup program item title
  await programList.gotoMyProgram();

  const programItemTitle = await programList.lotterySignupList
    .getByTestId("program-item-title")
    .textContent();

  expect(programItemTitle?.trim()).toContain(lotterySignupProgramItemTitle);
});

test("Receive spot in lottery signup", async ({ page, request }) => {
  const startTime = dayjs(config.event().eventStartTime)
    .add(4, "hour")
    .startOf("hour")
    .toISOString();
  const endTime = dayjs(startTime)
    .add(testProgramItem.mins, "minutes")
    .toISOString();

  await populateDb(request, {
    clean: true,
    admin: true,
    users: true,
  });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      endTime,
      // Adjust min/max so user will get the spot
      minAttendance: 1,
      maxAttendance: 1,
    },
  ]);

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });

  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);

  await programList.gotoAllProgram();
  const firstProgramItem = programList.firstItem();

  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirmLotterySignup();

  // Do assignment on background
  await postAssignment(request, startTime);
  await page.reload();

  // Check new assignment message
  await expect(programList.notificationBar.bar).toContainText(
    /You were assigned to the .* Test program item./,
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    /You were assigned to the .* Test program item./,
  );

  // Check lottery signup is still present
  await programList.navigation.gotoProgram();
  const lotterySignups = programList.lotterySignupList;
  await expect(lotterySignups.getByTestId("program-item-title")).toContainText(
    "1) Test program item",
  );
});

test("Did not receive spot in lottery signup", async ({ page, request }) => {
  const startTime = dayjs(config.event().eventStartTime)
    .add(4, "hour")
    .startOf("hour")
    .toISOString();
  const endTime = dayjs(startTime)
    .add(testProgramItem.mins, "minutes")
    .toISOString();

  await populateDb(request, {
    clean: true,
    admin: true,
    users: true,
  });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      endTime,
      // Adjust min/max so user cannot get the spot
      minAttendance: 2,
      maxAttendance: 2,
    },
  ]);

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });

  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);

  await programList.gotoAllProgram();
  const firstProgramItem = programList.firstItem();

  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirmLotterySignup();

  // Do assignment on background
  await postAssignment(request, startTime);
  await page.reload();

  // Check new assignment message
  await expect(programList.notificationBar.bar).toContainText(
    /Spots for program items at .* were randomized. Unfortunately, we couldn't fit you into any of your chosen program items./,
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    /Spots for program items at .* were randomized. Unfortunately, we couldn't fit you into any of your chosen program items./,
  );

  // Check lottery signup is still present
  await programList.navigation.gotoProgram();
  const lotterySignups = programList.lotterySignupList;
  await expect(lotterySignups.getByTestId("program-item-title")).toContainText(
    "1) Test program item",
  );
});

test("Receive spot in lottery signup, with multiple lottery program types", async ({
  page,
  request,
}) => {
  const startTime = dayjs(config.event().eventStartTime)
    .add(4, "hour")
    .startOf("hour")
    .toISOString();
  const endTime = dayjs(startTime)
    .add(testProgramItem.mins, "minutes")
    .toISOString();

  const firstProgramItemTitle = "first program item";
  const secondProgramItemTitle = "second program item";

  const twoPhaseSignupProgramTypes = config.event().twoPhaseSignupProgramTypes;
  const twoProgramTypes =
    twoPhaseSignupProgramTypes.length === 1
      ? [twoPhaseSignupProgramTypes[0], twoPhaseSignupProgramTypes[0]]
      : [twoPhaseSignupProgramTypes[0], twoPhaseSignupProgramTypes[1]];

  await populateDb(request, {
    clean: true,
    admin: true,
    users: true,
  });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: twoProgramTypes[0],
      title: firstProgramItemTitle,
      startTime,
      endTime,
      // Adjust min/max so user can get the spot
      minAttendance: 1,
      maxAttendance: 1,
    },
    {
      ...testProgramItem2,
      programType: twoProgramTypes[1],
      title: secondProgramItemTitle,
      startTime,
      endTime,
      // Adjust min/max so user can get the spot
      minAttendance: 1,
      maxAttendance: 1,
    },
  ]);

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });

  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);

  await programList.gotoAllProgram();

  const firstProgramItem = programList.itemByTitle(firstProgramItemTitle);
  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirmLotterySignup();

  const secondProgramItem = programList.itemByTitle(secondProgramItemTitle);
  await secondProgramItem.lotterySignup();
  await secondProgramItem.confirmLotterySignup();

  // Do assignment on background
  await postAssignment(request, startTime);
  await page.reload();

  // Check new assignment message
  await expect(programList.notificationBar.bar).toContainText(
    new RegExp(
      String.raw`You were assigned to the .* ${firstProgramItemTitle}\.`,
    ),
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    new RegExp(
      String.raw`You were assigned to the .* ${firstProgramItemTitle}\.`,
    ),
  );
});

test("Cancel lottery signup on program list", async ({ page, request }) => {
  const startTime = dayjs(config.event().eventStartTime)
    .add(3, "hour")
    .startOf("hour")
    .toISOString();
  const endTime = dayjs(startTime)
    .add(testProgramItem.mins, "minutes")
    .toISOString();

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      endTime,
    },
  ]);

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();

  const firstProgramItem = programList.firstItem();
  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirmLotterySignup();

  // Card shows the current lottery signup instead of the signup button
  await expect(firstProgramItem.container).toContainText(
    "This role-playing game is priority 1 on your lottery sign-ups.",
  );
  await expect(firstProgramItem.lotterySignupButton).toBeHidden();

  // Cancel the signup on the card
  await firstProgramItem.cancelSignup();
  await firstProgramItem.confirmCancellation();

  await expect(firstProgramItem.container).not.toContainText(
    "on your lottery sign-ups",
  );
  await expect(firstProgramItem.lotterySignupButton).toBeVisible();
});

test("Show limit message when three lottery signups in time slot", async ({
  page,
  request,
}) => {
  const startTime = dayjs(config.event().eventStartTime)
    .add(3, "hour")
    .startOf("hour")
    .toISOString();
  const endTime = dayjs(startTime)
    .add(testProgramItem.mins, "minutes")
    .toISOString();

  const titles = [
    "Lottery item Alpha",
    "Lottery item Beta",
    "Lottery item Gamma",
    "Lottery item Delta",
  ];

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(
    request,
    titles.map((title, index) => ({
      ...testProgramItem,
      programItemId: `lottery-item-${index}`,
      title,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      endTime,
    })),
  );

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  // Seed the first two signups in the time slot on the background
  await testPostLotterySignup(request, "test1", {
    programItemId: "lottery-item-0",
    priority: 1,
  });
  await testPostLotterySignup(request, "test1", {
    programItemId: "lottery-item-1",
    priority: 2,
  });

  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();

  // Third signup in the same time slot through the UI
  const thirdProgramItem = programList.itemByTitle(titles[2]);
  await thirdProgramItem.lotterySignup();
  await thirdProgramItem.confirmLotterySignup();

  // The fourth item in the slot shows the limit message and no signup button
  const fourthProgramItem = programList.itemByTitle(titles[3]);
  await expect(fourthProgramItem.container).toContainText(
    "You can select up to three items for the time slot.",
  );
  await expect(fourthProgramItem.lotterySignupButton).toBeHidden();
});
