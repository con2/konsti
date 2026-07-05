import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  postSettings,
  postTestSettings,
  login,
  addProgramItems,
  populateDb,
  postAssignment,
} from "playwright/playwrightUtils";
import { GroupPage } from "playwright/pages/GroupPage";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";

test("Can create and join a group and receive a shared lottery result", async ({
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
    testTime: config.event().eventStartTime,
  });

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const groupPage = new GroupPage(page);
  const programList = new ProgramListPage(page);

  // Create group
  const groupCode = await groupPage.createGroup();
  await expect(groupPage.main).toContainText("1) test1 (group creator)");

  // Lottery signup to program item
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

  // Check group creator lottery signups are visible
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
  await postTestSettings(request, { testTime: config.event().eventStartTime });

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

test("Group creator can close the group", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, { testTime: config.event().eventStartTime });

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
