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

  // Go to group page
  await page.getByTestId("navigation-icon").click();
  await page.getByTestId("link-profile").click();
  await page.getByRole("link", { name: "Group" }).click();

  // Create group
  await page.getByRole("button", { name: "Create group" }).click();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.locator("#main")).toContainText(
    "You are the group creator",
  );
  await expect(page.locator("#main")).toContainText("1) test1 (group creator)");

  // Get group code
  const groupCode = await page.locator("data-testid=group-code").textContent();
  if (!groupCode) {
    // eslint-disable-next-line no-restricted-syntax
    throw new Error("Group code was null");
  }

  // Lottery signup to program item
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Program" }).click();
  await page.getByTestId("program-list-tab").click();
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );
  await firstProgramItem
    .getByRole("button", { name: /lottery sign-up/i })
    .click();
  await firstProgramItem.getByRole("button", { name: /confirm/i }).click();

  // Logout and login with different user
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Logout" }).click();
  await login(page, request, { username: "test2", password: "test" });
  await page.goto("/");

  // Go to group page
  await page.getByTestId("navigation-icon").click();
  await page.getByTestId("link-profile").click();
  await page.getByRole("link", { name: "Group" }).click();

  // Join group
  await page.getByRole("button", { name: "Join group" }).click();
  await page
    .getByRole("textbox", { name: "Group creator's code" })
    .fill(groupCode);
  await page.getByRole("button", { name: "Join group" }).nth(1).click();
  await expect(page.locator("#main")).toContainText("1) test1 (group creator)");
  await expect(page.locator("#main")).toContainText("2) test2");

  // Check group creator lottery signups are visible
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Program" }).click();
  const lotterySignups = page.getByTestId("lottery-signup-program-items-list");
  await expect(lotterySignups).toContainText(
    "You are in a group. Sign-ups in this list have been made by your group creator.",
  );
  await expect(lotterySignups.getByTestId("program-item-title")).toContainText(
    "1) Test program item",
  );

  // Do assignment on background
  await postAssignment(request, startTime);
  await page.reload();

  // Check new assigment message
  await expect(page.getByTestId("notification-bar")).toContainText(
    "You were assigned to the roleplaying game Test program item.",
  );

  // Logout and login with group creator user
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Logout" }).click();
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  // Check new assigment message
  await expect(page.getByTestId("notification-bar")).toContainText(
    "You were assigned to the roleplaying game Test program item.",
  );
});
