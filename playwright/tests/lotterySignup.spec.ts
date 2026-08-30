import { expect, test } from "@playwright/test";
import { addHours, addMinutes, subHours, subMinutes } from "date-fns";
import { capitalize } from "remeda";
import { config } from "shared/config";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { getProgramTypePluralName } from "shared/constants/programTypeNames";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { Locale } from "shared/types/locale";
import { ProgramType, Tag } from "shared/types/models/programItem";
import { getTime } from "shared/utils/timeFormatter";
import { ProgramItemPage } from "playwright/pages/ProgramItemPage";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  hoursIntoEvent,
  login,
  populateDb,
  postAssignment,
  postSettings,
  postTestSettings,
  testPostDirectSignup,
  testPostLotterySignup,
} from "playwright/playwrightUtils";

const alwaysOpenTitle = "Always open item";

test("Add lottery signup", async ({ page, request }) => {
  const startTime = hoursIntoEvent(3);
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
  const startTime = hoursIntoEvent(4);
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
  const startTime = hoursIntoEvent(4);
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
  const startTime = hoursIntoEvent(4);
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
    [ProgramType.BOARDGAME]: "board game",
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
  const startTime = hoursIntoEvent(3);
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
  const startTime = hoursIntoEvent(3);
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

// Once a start time has been lotteried, nothing at it takes lottery sign-ups any more, so the
// spot being held has to come from a program item outside the lottery
test("Offer lottery sign-up even while a spot at the same time is held", async ({
  page,
  request,
}) => {
  const startTime = hoursIntoEvent(3);
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
    {
      // Lottery program type with the pre-convention week tag makes 'sign-up always open',
      // which is the only way to hold a spot at a time whose lottery hasn't run yet
      ...testProgramItem2,
      title: alwaysOpenTitle,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      tags: [Tag.PRE_CONVENTION_WEEK],
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

  await testPostDirectSignup(request, "test1", {
    directSignupProgramItemId: testProgramItem2.programItemId,
    message: "",
  });

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();

  // A spot they took themselves doesn't keep them out of the lottery - if it places them,
  // what they win replaces the spot they hold
  const lotteryProgramItem = programList.itemByTitle(testProgramItem.title);
  await expect(lotteryProgramItem.lotterySignupButton).toBeVisible();
  await expect(lotteryProgramItem.container).not.toContainText(
    "The lottery only gives out spots to those who don't have one yet",
  );
});

test("Offer direct sign-up instead of a lottery for a program item that already has sign-ups", async ({
  page,
  request,
}) => {
  const startTime = hoursIntoEvent(4);
  const endTime = addMinutes(
    new Date(startTime),
    testProgramItem.mins,
  ).toISOString();

  await populateDb(request, { clean: true, users: true, admin: true });

  // Sign-up always open, so it can take a spot before any lottery has run
  const alwaysOpenProgramItem = {
    ...testProgramItem,
    programType: config.event().twoPhaseSignupProgramTypes[0],
    tags: [Tag.PRE_CONVENTION_WEEK],
    startTime,
    endTime,
  };
  await addProgramItems(request, [alwaysOpenProgramItem]);

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  await testPostDirectSignup(request, "test2", {
    directSignupProgramItemId: testProgramItem.programItemId,
    message: "",
  });

  // Dropping the tag turns it into a lottery program item, but it already has a spot taken by
  // another rule - so it stays on direct signup rather than being lotteried for the rest
  await addProgramItems(request, [{ ...alwaysOpenProgramItem, tags: [] }]);

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();

  const programItem = programList.itemByTitle(testProgramItem.title);
  await expect(programItem.lotterySignupButton).toBeHidden();
  await expect(programItem.container).toContainText(
    "It already has sign-ups, so it does not take part in the lottery.",
  );
  // Its sign-up has been open all along, and does not shut now that the two-phase schedule it
  // has just landed on says sign-up is still hours away
  await expect(programItem.signUpButton).toBeVisible();
  await expect(programItem.container).toContainText("Sign-up closes");
  await expect(programItem.container).not.toContainText("Sign-up opens");

  // Ends on the program item's own page so a headed run leaves this state on screen
  await programItem.title.click();

  const programItemPage = new ProgramItemPage(page);
  await expect(programItemPage.main).toContainText(
    "It already has sign-ups, so it does not take part in the lottery.",
  );
  await expect(programItemPage.main).toContainText("Sign-up closes");
});

test("Did not receive spot in a lottery covering several starting times", async ({
  page,
  request,
}) => {
  // A batched lottery decides several starting times in one run, so its rejection names the
  // whole span instead of the parent hour the run was scheduled at
  const [parentId, parentStartTime] = [
    ...config.event().startTimesByParentIds,
  ][0];
  // Both slots start after the parent hour, so the span the message names cannot be mistaken
  // for the hour the run was scheduled at
  const firstStartTime = addMinutes(
    new Date(parentStartTime),
    30,
  ).toISOString();
  const secondStartTime = addMinutes(
    new Date(parentStartTime),
    60,
  ).toISOString();
  const lastEndTime = addMinutes(new Date(parentStartTime), 90).toISOString();

  await populateDb(request, { clean: true, admin: true, users: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      parentId,
      startTime: firstStartTime,
      endTime: secondStartTime,
      // Adjust min/max so user cannot get the spot
      minAttendance: 2,
      maxAttendance: 2,
    },
    {
      ...testProgramItem2,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      parentId,
      startTime: secondStartTime,
      endTime: lastEndTime,
      minAttendance: 2,
      maxAttendance: 2,
    },
  ]);

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  // Inside the batch's lottery signup window, which is derived from the parent start time
  await postTestSettings(request, {
    testTime: subHours(new Date(parentStartTime), 3).toISOString(),
  });

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirmLotterySignup();

  await postAssignment(request, parentStartTime);
  await page.reload();

  // The span the batch covered, first start to last end, not the parent hour
  const programTypeName = capitalize(
    getProgramTypePluralName(
      config.event().twoPhaseSignupProgramTypes[0],
      Locale.EN,
    ),
  );
  const expectedRejection = `${programTypeName} between ${getTime(firstStartTime)}–${getTime(lastEndTime)} were lotteried and you didn't get a spot.`;
  await expect(programList.notificationBar.bar).toContainText(
    expectedRejection,
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    expectedRejection,
  );
});

test("Receive spot in a lottery covering several starting times", async ({
  page,
  request,
}) => {
  // A batched run decides several starting times at once, but a spot belongs to the hour its own
  // program item starts - the hour the attendee turns up - and not to the hour the batch ran at
  const [parentId, parentStartTime] = [
    ...config.event().startTimesByParentIds,
  ][0];
  const firstStartTime = addMinutes(
    new Date(parentStartTime),
    30,
  ).toISOString();
  const secondStartTime = addMinutes(
    new Date(parentStartTime),
    60,
  ).toISOString();
  const lastEndTime = addMinutes(new Date(parentStartTime), 90).toISOString();
  const alwaysOpenProgramItemId = "always-open-at-batch-hour";

  await populateDb(request, { clean: true, admin: true, users: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      parentId,
      startTime: firstStartTime,
      endTime: secondStartTime,
      // Adjust min/max so user will get the spot
      minAttendance: 1,
      maxAttendance: 1,
    },
    {
      ...testProgramItem2,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      parentId,
      startTime: secondStartTime,
      endTime: lastEndTime,
      minAttendance: 1,
      maxAttendance: 1,
    },
    {
      // 'Sign-up always open', so a spot here can be held before the run. It starts at the hour
      // the batch is lotteried at, which is the hour a spot won in the batch would displace if
      // the batch time were taken for the winner's own
      ...testProgramItem,
      programItemId: alwaysOpenProgramItemId,
      parentId: alwaysOpenProgramItemId,
      title: alwaysOpenTitle,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      tags: [Tag.PRE_CONVENTION_WEEK],
      startTime: parentStartTime,
      endTime: firstStartTime,
    },
  ]);

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  // Inside the batch's lottery signup window, which is derived from the parent start time
  await postTestSettings(request, {
    testTime: subHours(new Date(parentStartTime), 3).toISOString(),
  });

  await testPostDirectSignup(request, "test1", {
    directSignupProgramItemId: alwaysOpenProgramItemId,
    message: "",
  });
  await testPostLotterySignup(request, "test1", {
    programItemId: testProgramItem.programItemId,
    priority: 1,
  });

  await postAssignment(request, parentStartTime);

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoMyProgram();

  await expect(programList.directSignupList).toContainText(
    testProgramItem.title,
  );
  // Listed under the hour its own program item starts, not the hour the batch was lotteried at
  await expect(programList.directSignupList).toContainText(
    getTime(firstStartTime),
  );

  // The spot they held is at a different hour from the one they won, so the win leaves it be -
  // even though it is the hour the batch was lotteried at
  await expect(programList.directSignupList).toContainText(alwaysOpenTitle);
  await expect(programList.directSignupList).toContainText(
    getTime(parentStartTime),
  );
});

test("Keep a program item out of the lottery after its direct sign-ups are cancelled", async ({
  page,
  request,
}) => {
  const startTime = hoursIntoEvent(4);
  const endTime = addMinutes(
    new Date(startTime),
    testProgramItem.mins,
  ).toISOString();

  await populateDb(request, { clean: true, users: true, admin: true });

  // Sign-up always open, so it can take a spot before any lottery has run
  const alwaysOpenProgramItem = {
    ...testProgramItem,
    programType: config.event().twoPhaseSignupProgramTypes[0],
    tags: [Tag.PRE_CONVENTION_WEEK],
    startTime,
    endTime,
  };
  const lotteryProgramItem = { ...alwaysOpenProgramItem, tags: [] };

  await addProgramItems(request, [alwaysOpenProgramItem]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  await testPostDirectSignup(request, "test1", {
    directSignupProgramItemId: testProgramItem.programItemId,
    message: "",
  });

  // Becomes a lottery program item while holding that spot, so it is passed over
  await addProgramItems(request, [lotteryProgramItem]);

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();

  const programItem = programList.itemByTitle(testProgramItem.title);
  await expect(programItem.container).toContainText(
    "It already has sign-ups, so it does not take part in the lottery.",
  );

  await programItem.cancelSignup();
  await programItem.confirmCancellation();
  await expect(programItem.signUpButton).toBeVisible();

  // The decision is recorded rather than re-read from whoever holds a spot, so emptying the
  // program item cannot put it back into a lottery it was already left out of
  await addProgramItems(request, [lotteryProgramItem]);
  await page.reload();
  await programList.waitForItems();

  await expect(programItem.lotterySignupButton).toBeHidden();
  await expect(programItem.container).toContainText(
    "It already has sign-ups, so it does not take part in the lottery.",
  );
  await expect(programItem.signUpButton).toBeVisible();
});

test("Keep the lottery sign-ups a program item carries out of the lottery", async ({
  page,
  request,
}) => {
  // The only route to a lottery sign-up for a program item that is then passed over: it leaves
  // the lottery late enough for its sign-ups to be preserved, takes a spot while its sign-up is
  // always open, and comes back inside the gap before direct sign-up would have opened. Its
  // lottery has run by then, so the sign-up stays as the record of having entered it
  const startTime = hoursIntoEvent(6);
  const lotterySignupEndTime = subMinutes(
    new Date(startTime),
    config.event().directSignupPhaseStart,
  );

  await populateDb(request, { clean: true, users: true, admin: true });

  const lotteryProgramItem = {
    ...testProgramItem,
    programType: config.event().twoPhaseSignupProgramTypes[0],
    startTime,
  };
  await addProgramItems(request, [lotteryProgramItem]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });

  await postTestSettings(request, {
    testTime: subMinutes(lotterySignupEndTime, 60).toISOString(),
  });
  await testPostLotterySignup(request, "test1", {
    programItemId: testProgramItem.programItemId,
    priority: 1,
  });

  // Sign-up always open from here on. The lottery sign-up is kept rather than cancelled,
  // because its window has closed and it can no longer be made again
  await postTestSettings(request, {
    testTime: addMinutes(lotterySignupEndTime, 1).toISOString(),
  });
  await addProgramItems(request, [
    { ...lotteryProgramItem, tags: [Tag.PRE_CONVENTION_WEEK] },
  ]);
  await testPostDirectSignup(request, "test2", {
    directSignupProgramItemId: testProgramItem.programItemId,
    message: "",
  });

  // Back to a lottery program item, now holding a spot, so it is passed over
  await postTestSettings(request, {
    testTime: addMinutes(lotterySignupEndTime, 2).toISOString(),
  });
  await addProgramItems(request, [lotteryProgramItem]);

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoMyProgram();
  await expect(programList.lotterySignupList).toContainText(
    testProgramItem.title,
  );

  // Nothing was taken away, so there is nothing to tell them about either
  await expect(programList.notificationBar.bar).toBeHidden();

  // The program item is still out of the lottery, and says so
  await programList.gotoAllProgram();
  await programList.waitForItems();
  const programItem = programList.itemByTitle(testProgramItem.title);
  await expect(programItem.lotterySignupButton).toBeHidden();
  await expect(programItem.container).toContainText(
    "It already has sign-ups, so it does not take part in the lottery.",
  );
});
