import { expect, test } from "@playwright/test";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  clearDb,
  hoursIntoEvent,
  login,
  populateDb,
  postTestSettings,
} from "playwright/playwrightUtils";

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
