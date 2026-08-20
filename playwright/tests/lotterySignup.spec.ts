import { expect, test } from "@playwright/test";
import { addHours, addMinutes, startOfHour, subHours } from "date-fns";
import { config } from "shared/config";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { ProgramType } from "shared/types/models/programItem";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  login,
  populateDb,
  postAssignment,
  postSettings,
  postTestSettings,
  testPostLotterySignup,
} from "playwright/playwrightUtils";

test("Add lottery signup", async ({ page, request }) => {
  const startTime = startOfHour(
    addHours(new Date(config.event().eventStartTime), 3),
  ).toISOString();
  const endTime = addMinutes(
    new Date(startTime),
    testProgramItem.mins,
  ).toISOString();

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

  // Lottery sign-up to first program item
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  const lotterySignupProgramItemTitle =
    await firstProgramItem.title.textContent();

  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirmLotterySignup();

  // Go to My Program and check lottery sign-up program item title
  await programList.gotoMyProgram();

  const programItemTitle = await programList.lotterySignupList
    .getByTestId("program-item-title")
    .textContent();

  expect(programItemTitle?.trim()).toContain(lotterySignupProgramItemTitle);
});

test("Receive spot in lottery signup", async ({ page, request }) => {
  const startTime = startOfHour(
    addHours(new Date(config.event().eventStartTime), 4),
  ).toISOString();
  const endTime = addMinutes(
    new Date(startTime),
    testProgramItem.mins,
  ).toISOString();

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

  // Check lottery sign-up is still present
  await programList.navigation.gotoProgram();
  const lotterySignups = programList.lotterySignupList;
  await expect(lotterySignups.getByTestId("program-item-title")).toContainText(
    "1) Test program item",
  );
});

test("Did not receive spot in lottery signup", async ({ page, request }) => {
  const startTime = startOfHour(
    addHours(new Date(config.event().eventStartTime), 4),
  ).toISOString();
  const endTime = addMinutes(
    new Date(startTime),
    testProgramItem.mins,
  ).toISOString();

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

  // Check lottery sign-up is still present
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
  const startTime = startOfHour(
    addHours(new Date(config.event().eventStartTime), 4),
  ).toISOString();
  const endTime = addMinutes(
    new Date(startTime),
    testProgramItem.mins,
  ).toISOString();

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

  // The two program items overlap, so the user gets a spot in exactly one of
  // them - which one depends on the assignment algorithm
  const assignedMessage = new RegExp(
    String.raw`You were assigned to the .* (${firstProgramItemTitle}|${secondProgramItemTitle})\.`,
  );

  // Check new assignment message
  await expect(programList.notificationBar.bar).toContainText(assignedMessage);

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    assignedMessage,
  );
});

test("Receive seat from each lottery program type in separate time slots", async ({
  page,
  request,
}) => {
  const { eventStartTime, twoPhaseSignupProgramTypes } = config.event();

  // Expected English names for the program type interpolations, the
  // programTypeSingular and programTypeIllative locale values are identical in English
  const programTypeNamesEn: Record<ProgramType, string> = {
    [ProgramType.TABLETOP_RPG]: "role-playing game",
    [ProgramType.LARP]: "larp",
    [ProgramType.TOURNAMENT]: "tournament",
    [ProgramType.WORKSHOP]: "workshop",
    [ProgramType.EXPERIENCE_POINT]: "game",
    [ProgramType.OTHER]: "program item",
    [ProgramType.ROUNDTABLE_DISCUSSION]: "roundtable discussion",
    [ProgramType.FLEAMARKET]: "flea market time",
    [ProgramType.OTHER_GAMING]: "game",
  };

  // One program item per lottery program type in consecutive lottery slots.
  // Each slot's lottery sign-up window is [start - 4h, start - 2h], so the test
  // time is advanced to the window start before each sign-up
  const slots = [4, 6, 8].map((hoursFromEventStart, index) => {
    const programType =
      twoPhaseSignupProgramTypes[index % twoPhaseSignupProgramTypes.length];
    const startTime = addHours(
      new Date(eventStartTime),
      hoursFromEventStart,
    ).toISOString();
    return {
      programType,
      title: `Lottery slot ${hoursFromEventStart}h ${programTypeNamesEn[programType]}`,
      startTime,
      signupTime: subHours(new Date(startTime), 4).toISOString(),
    };
  });

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(
    request,
    slots.map((slot, index) => ({
      ...testProgramItem,
      programItemId: `lottery-slot-item-${index}`,
      parentId: `lottery-slot-item-${index}`,
      title: slot.title,
      programType: slot.programType,
      startTime: slot.startTime,
      endTime: addHours(new Date(slot.startTime), 1).toISOString(),
      // Keep items short so consecutive slots don't overlap: with the OVERLAP
      // removal strategy a longer win would drop the later lottery sign-ups
      mins: 60,
      // Adjust min/max so user will get the spot in every slot
      minAttendance: 1,
      maxAttendance: 1,
    })),
  );

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });

  await login(page, request, { username: "test1", password: "test" });

  const programList = new ProgramListPage(page);

  // Lottery sign-up to each program item in its own sign-up window, running that
  // slot's lottery before signing up to the next one. Sign-up removal strategies
  // that drop a winner's other upcoming sign-ups would otherwise leave the later
  // slots with nothing to assign
  for (const slot of slots) {
    await postTestSettings(request, { testTime: slot.signupTime });
    await page.goto("/");
    await programList.gotoAllProgram();

    const card = programList.itemByTitle(slot.title);
    await card.lotterySignup();
    await card.confirmLotterySignup();

    // The card renders the per-program-type priority text
    await expect(card.container).toContainText(
      `This ${programTypeNamesEn[slot.programType]} is priority 1 on your lottery sign-ups.`,
    );

    await postAssignment(request, slot.startTime);
  }

  await page.reload();

  // Each slot's assignment renders its own notification bar with the per-type text
  for (const slot of slots) {
    await expect(
      programList.notificationBar.bar.filter({ hasText: slot.title }),
    ).toContainText(
      `You were assigned to the ${programTypeNamesEn[slot.programType]}`,
    );
  }
  await programList.notificationBar.showAllNotifications();
  for (const slot of slots) {
    await expect(
      programList.notificationBar.eventLogItem.filter({ hasText: slot.title }),
    ).toContainText(
      `You were assigned to the ${programTypeNamesEn[slot.programType]}`,
    );
  }

  // All three seats show as direct sign-ups in My Program
  await programList.navigation.gotoProgram();
  await programList.gotoMyProgram();
  for (const slot of slots) {
    await expect(
      programList.directSignupList
        .getByTestId("program-item-title")
        .filter({ hasText: slot.title }),
    ).toBeVisible();
  }
});

test("Cancel lottery signup on program list", async ({ page, request }) => {
  const startTime = startOfHour(
    addHours(new Date(config.event().eventStartTime), 3),
  ).toISOString();
  const endTime = addMinutes(
    new Date(startTime),
    testProgramItem.mins,
  ).toISOString();

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

  // Card shows the current lottery sign-up instead of the sign-up button
  await expect(firstProgramItem.container).toContainText(
    "is priority 1 on your lottery sign-ups.",
  );
  await expect(firstProgramItem.lotterySignupButton).toBeHidden();

  // Cancel the sign-up on the card
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
  const startTime = startOfHour(
    addHours(new Date(config.event().eventStartTime), 3),
  ).toISOString();
  const endTime = addMinutes(
    new Date(startTime),
    testProgramItem.mins,
  ).toISOString();

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

  // Seed the first two sign-ups in the time slot on the background
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

  // Third sign-up in the same time slot through the UI
  const thirdProgramItem = programList.itemByTitle(titles[2]);
  await thirdProgramItem.lotterySignup();
  await thirdProgramItem.confirmLotterySignup();

  // The fourth item in the slot shows the limit message and no sign-up button
  const fourthProgramItem = programList.itemByTitle(titles[3]);
  await expect(fourthProgramItem.container).toContainText(
    "You can select up to three items for the time slot.",
  );
  await expect(fourthProgramItem.lotterySignupButton).toBeHidden();
});
