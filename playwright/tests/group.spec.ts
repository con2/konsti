import { expect, test } from "@playwright/test";
import { addMinutes } from "date-fns";
import { config } from "shared/config";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { GroupPage } from "playwright/pages/GroupPage";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  hoursIntoEvent,
  login,
  populateDb,
  postAssignment,
  postSettings,
  postTestSettings,
  signupsOpenTime,
  testPostDirectSignup,
} from "playwright/playwrightUtils";

test("Can create and join a group and receive a shared lottery result", async ({
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
      // Adjust min/max so group will get the spot
      minAttendance: 2,
      maxAttendance: 2,
    },
  ]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, {
    testTime: signupsOpenTime(),
  });

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const groupPage = new GroupPage(page);
  const programList = new ProgramListPage(page);

  // Create group
  const groupCode = await groupPage.createGroup();
  await expect(groupPage.main).toContainText("1) test1 (group creator)");

  // Lottery sign-up to program item
  await groupPage.navigation.gotoProgram();
  await programList.gotoAllProgram();
  const firstProgramItem = programList.firstItem();
  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirmLotterySignup();

  // Logout and login with different user
  await groupPage.navigation.logout();
  await login(page, request, { username: "test2", password: "test" });
  await page.goto("/");

  // Join group
  await groupPage.goto();
  await groupPage.joinGroup(groupCode);
  await expect(groupPage.main).toContainText("1) test1 (group creator)");
  await expect(groupPage.main).toContainText("2) test2");

  // Check group creator lottery sign-ups are visible
  await groupPage.navigation.gotoProgram();
  const lotterySignups = programList.lotterySignupList;
  await expect(lotterySignups).toContainText(
    "You are in a group. Sign-ups in this list have been made by your group creator.",
  );
  await expect(lotterySignups.getByTestId("program-item-title")).toContainText(
    "1) Test program item",
  );

  // Do assignment on background
  await postAssignment(request, startTime);
  await page.reload();

  // Check new assignment message
  await expect(groupPage.notificationBar.bar).toContainText(
    /You were assigned to the .* Test program item./,
  );

  // Logout and login with group creator user
  await groupPage.navigation.logout();
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  // Check new assignment message
  await expect(groupPage.notificationBar.bar).toContainText(
    /You were assigned to the .* Test program item./,
  );
});

test("Group member can leave the group", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, { testTime: signupsOpenTime() });

  const groupPage = new GroupPage(page);

  // Creator creates the group
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");
  const groupCode = await groupPage.createGroup();

  // Member joins the group
  await groupPage.navigation.logout();
  await login(page, request, { username: "test2", password: "test" });
  await page.goto("/");
  await groupPage.goto();
  await groupPage.joinGroup(groupCode);
  await expect(groupPage.main).toContainText("You are in a group");

  // Member leaves the group
  await groupPage.leaveGroup();
  await expect(groupPage.createGroupButton).toBeVisible();
});

test("Show error when joining a group that does not exist", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, { testTime: signupsOpenTime() });

  const groupPage = new GroupPage(page);

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");
  await groupPage.goto();
  await groupPage.joinGroup("123-234-345");

  await expect(groupPage.main).toContainText("Group does not exist");

  // User is still not in a group
  await expect(groupPage.createGroupButton).toBeVisible();
});

test("Group creator can close the group", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, { testTime: signupsOpenTime() });

  const groupPage = new GroupPage(page);

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");
  await groupPage.createGroup();

  // Closing asks for confirmation, then disbands the group
  await groupPage.closeGroup();
  await expect(groupPage.main).toContainText(
    "Are you sure you want to close the group",
  );
  await groupPage.confirmCloseGroup();
  await expect(groupPage.createGroupButton).toBeVisible();
});

test("Group member cannot lottery sign-up but group creator can", async ({
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
  ]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, { testTime: signupsOpenTime() });

  const groupPage = new GroupPage(page);
  const programList = new ProgramListPage(page);

  // Creator creates the group and sees the lottery sign-up button
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");
  const groupCode = await groupPage.createGroup();

  await groupPage.navigation.gotoProgram();
  await programList.gotoAllProgram();
  const firstProgramItem = programList.firstItem();
  await expect(firstProgramItem.lotterySignupButton).toBeVisible();

  // Member joins the group and cannot sign up
  await groupPage.navigation.logout();
  await login(page, request, { username: "test2", password: "test" });
  await page.goto("/");
  await groupPage.goto();
  await groupPage.joinGroup(groupCode);
  await expect(groupPage.main).toContainText("You are in a group");

  await groupPage.navigation.gotoProgram();
  await programList.gotoAllProgram();
  await expect(firstProgramItem.container).toContainText(
    "You can't sign up because you are a member of a group. Only the group creator can sign the group up to the lottery.",
  );
  await expect(firstProgramItem.lotterySignupButton).toBeHidden();
});

test("Show error when group is bigger than the program item's maximum attendance", async ({
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
      minAttendance: 1,
      maxAttendance: 1,
    },
  ]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, { testTime: signupsOpenTime() });

  const groupPage = new GroupPage(page);
  const programList = new ProgramListPage(page);

  // Creator creates the group
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");
  const groupCode = await groupPage.createGroup();

  // Member joins, making the group bigger than the program item's maximum
  await groupPage.navigation.logout();
  await login(page, request, { username: "test2", password: "test" });
  await page.goto("/");
  await groupPage.goto();
  await groupPage.joinGroup(groupCode);
  await expect(groupPage.main).toContainText("You are in a group");

  // Creator tries to sign up the group
  await groupPage.navigation.logout();
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");
  await programList.gotoAllProgram();

  const firstProgramItem = programList.firstItem();
  await firstProgramItem.lotterySignup();

  await expect(firstProgramItem.container).toContainText(
    "The group is bigger than the maximum number of attendees",
  );
  // The sign-up form did not open
  await expect(firstProgramItem.confirmButton).toBeHidden();
});

test("Upcoming direct sign-ups block creating and joining a group", async ({
  page,
  request,
}) => {
  // Both program items take a rolling direct sign-up, which is open from the
  // moment sign-ups do, so both are upcoming and signable at that time. A two
  // phase program type could not be: its direct sign-up opens shortly before
  // the item starts, so only one whole hour could ever be in that phase here.
  const startTime1 = hoursIntoEvent(1);
  const startTime2 = hoursIntoEvent(2);

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().rollingDirectSignupProgramTypes[0],
      startTime: startTime1,
      endTime: addMinutes(
        new Date(startTime1),
        testProgramItem.mins,
      ).toISOString(),
    },
    {
      ...testProgramItem2,
      programType: config.event().rollingDirectSignupProgramTypes[0],
      startTime: startTime2,
      endTime: addMinutes(
        new Date(startTime2),
        testProgramItem2.mins,
      ).toISOString(),
    },
  ]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, { testTime: signupsOpenTime() });

  // Sign up to the later program item first: the list must still show the
  // earlier program item first
  await testPostDirectSignup(request, "test1", {
    directSignupProgramItemId: testProgramItem2.programItemId,
    message: "",
  });
  await testPostDirectSignup(request, "test1", {
    directSignupProgramItemId: testProgramItem.programItemId,
    message: "",
  });

  const groupPage = new GroupPage(page);

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");
  await groupPage.goto();

  // Blocking sign-ups are listed with start times in chronological order
  await expect(groupPage.main).toContainText(
    "You have already signed up to these upcoming program items:",
  );
  await expect(groupPage.upcomingDirectSignups).toHaveCount(2);
  await expect(groupPage.upcomingDirectSignups.nth(0)).toContainText(
    new RegExp(String.raw`${testProgramItem.title} - \w+ \d{2}:\d{2}`),
  );
  await expect(groupPage.upcomingDirectSignups.nth(1)).toContainText(
    new RegExp(String.raw`${testProgramItem2.title} - \w+ \d{2}:\d{2}`),
  );
  await expect(groupPage.main).toContainText(
    "You'll have to cancel these sign-ups before you can create or join a group.",
  );

  // Group actions are blocked
  await expect(groupPage.createGroupButton).toBeDisabled();
  await expect(groupPage.joinGroupButton).toBeDisabled();

  // Once the program items have started, they no longer block group actions
  await postTestSettings(request, {
    testTime: addMinutes(new Date(startTime2), 1).toISOString(),
  });
  await page.reload();

  await expect(groupPage.createGroupButton).toBeEnabled();
  await expect(groupPage.joinGroupButton).toBeEnabled();
  await expect(groupPage.main).not.toContainText(
    "You have already signed up to these upcoming program items",
  );
});
