import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  postTestSettings,
  login,
  addProgramItems,
  clearDb,
  addUser,
} from "playwright/playwrightUtils";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";

test("Show event log notification when program item with direct signup is moved", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await addUser(request, "test1");
  await addProgramItems(request, [
    {
      programItemId: testProgramItem.programItemId,
      startTime: dayjs(config.event().eventStartTime)
        .add(1, "hour")
        .startOf("hour")
        .toISOString(),
    },
  ]);

  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  // Navigate to program list tab and select RPG program type
  await page.click("data-testid=program-list-tab");
  await page
    .getByRole("combobox", {
      name: /program type/i,
    })
    .selectOption("Tabletop RPG");

  // Direct signup to first program item
  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  await firstProgramItem.getByRole("button", { name: /sign up/i }).click();
  await firstProgramItem.getByRole("button", { name: /confirm/i }).click();

  await expect(page.getByTestId("program-item-container")).toContainText(
    "1/4 sign-ups",
  );

  // Change program item state on background
  await addProgramItems(request, [
    {
      programItemId: testProgramItem.programItemId,
      startTime: dayjs(config.event().eventStartTime)
        .add(2, "hours")
        .startOf("hour")
        .toISOString(),
    },
  ]);

  await page.reload();

  await expect(page.getByTestId("notification-bar")).toContainText(
    "Roleplaying game Test program item starting time has changed",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Roleplaying game Test program item starting time has changed",
  );
});
