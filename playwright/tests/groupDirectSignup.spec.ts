import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  postSettings,
  postTestSettings,
  login,
  addProgramItems,
  populateDb,
} from "playwright/playwrightUtils";
import { GroupPage } from "playwright/pages/GroupPage";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { config } from "shared/config";
import { Tag } from "shared/types/models/programItem";
import { testProgramItem } from "shared/tests/testProgramItem";

test("Group member signing up to a 'signup always open' program item stays in the group", async ({
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

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      // Lottery program type with the pre-convention week tag makes 'signup always open'
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
  await programList.selectProgramType("Tabletop RPG");
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
  // Program item is in the direct signup phase at event start time
  const startTime = dayjs(config.event().eventStartTime)
    .add(1, "hour")
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
  await programList.selectProgramType("Tabletop RPG");
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();
  await firstProgramItem.signUp();
  await firstProgramItem.confirm();
  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");

  // Member has been removed from the group
  await groupPage.goto();
  await expect(groupPage.createGroupButton).toBeVisible();
});
