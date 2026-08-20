import { expect, test } from "@playwright/test";
import { addHours, addMinutes, startOfHour } from "date-fns";
import { config } from "shared/config";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { testProgramItem } from "shared/tests/testProgramItem";
import { Tag } from "shared/types/models/programItem";
import { GroupPage } from "playwright/pages/GroupPage";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  login,
  populateDb,
  postSettings,
  postTestSettings,
} from "playwright/playwrightUtils";

test("Group member signing up to a 'signup always open' program item stays in the group", async ({
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

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      // Lottery program type with the pre-convention week tag makes 'sign-up always open'
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

  const groupPage = new GroupPage(page);
  const programList = new ProgramListPage(page);

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

  // Member direct signs up to the always open program item
  await groupPage.navigation.gotoProgram();
  await programList.gotoAllProgram();
  // Pre-convention week program is not in the upcoming list during the main event
  await programList.selectStartingTime("All");
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  // Group members are told they can sign up to always open program items
  await expect(firstProgramItem.container).toContainText(
    "You can sign up even though you are a group member.",
  );

  await firstProgramItem.signUp();
  await firstProgramItem.confirm();
  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");

  // Member is still in the group
  await groupPage.goto();
  await expect(groupPage.main).toContainText("You are in a group");
  await expect(groupPage.main).toContainText("test2");
});

test("Group member direct signing up to a normal program item is removed from the group", async ({
  page,
  request,
}) => {
  // Program item is in the direct sign-up phase at event start time
  const startTime = startOfHour(
    addHours(new Date(config.event().eventStartTime), 1),
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

  const groupPage = new GroupPage(page);
  const programList = new ProgramListPage(page);

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

  // Member direct signs up to the normal program item
  await groupPage.navigation.gotoProgram();
  await programList.gotoAllProgram();
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();
  await firstProgramItem.signUp();
  await firstProgramItem.confirm();
  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");

  // Member has been removed from the group
  await groupPage.goto();
  await expect(groupPage.createGroupButton).toBeVisible();
});
