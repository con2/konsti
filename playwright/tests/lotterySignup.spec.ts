import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  postSettings,
  postTestSettings,
  login,
  addProgramItems,
  populateDb,
  addUser,
  postAssignment,
} from "playwright/playwrightUtils";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { ProgramType } from "shared/types/models/programItem";

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

  // Navigate to program list tab and select RPG program type
  await page.click("data-testid=program-list-tab");
  await page
    .getByRole("combobox", {
      name: /program type/i,
    })
    .selectOption("Tabletop RPG");

  // Lottery signup to first program item
  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  const lotterySignupProgramItemTitle = await firstProgramItem
    .locator("data-testid=program-item-title")
    .textContent();

  await firstProgramItem
    .getByRole("button", { name: /lottery sign-up/i })
    .click();
  await firstProgramItem.getByRole("button", { name: /confirm/i }).click();

  // Go to My Program and check lottery signup program item title
  await page.click("data-testid=my-program-tab");

  const lotterySignupProgramItems = page.locator(
    "data-testid=lottery-signup-program-items-list",
  );

  const programItemTitle = await lotterySignupProgramItems
    .locator("data-testid=program-item-title")
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
  });
  await addUser(request, "test1");
  await addProgramItems(request, [
    {
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

  await page.click("data-testid=program-list-tab");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  await firstProgramItem
    .getByRole("button", { name: /lottery sign-up/i })
    .click();
  await firstProgramItem.getByRole("button", { name: /confirm/i }).click();

  // Do assignment on background
  await postAssignment(request, startTime);
  await page.reload();

  // Check new assigment message
  await expect(page.getByTestId("notification-bar")).toContainText(
    "You were assigned to the roleplaying game Test program item.",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "You were assigned to the roleplaying game Test program item.",
  );

  // Check lottery signup is still present
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Program", exact: true }).click();
  const lotterySignups = page.getByTestId("lottery-signup-program-items-list");
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
  });
  await addUser(request, "test1");
  await addProgramItems(request, [
    {
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

  await page.click("data-testid=program-list-tab");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  await firstProgramItem
    .getByRole("button", { name: /lottery sign-up/i })
    .click();
  await firstProgramItem.getByRole("button", { name: /confirm/i }).click();

  // Do assignment on background
  await postAssignment(request, startTime);
  await page.reload();

  // Check new assigment message
  await expect(page.getByTestId("notification-bar")).toContainText(
    "Spots for program items at 19:00 were randomized. Unfortunately, we couldn't fit you into any of your chosen program items.",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Spots for program items at 19:00 were randomized. Unfortunately, we couldn't fit you into any of your chosen program items.",
  );

  // Check lottery signup is still present
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Program", exact: true }).click();
  const lotterySignups = page.getByTestId("lottery-signup-program-items-list");
  await expect(lotterySignups.getByTestId("program-item-title")).toContainText(
    "1) Test program item",
  );
});

// TODO: Enable this - requires figuring how different configs are passed for playwright tests
test.skip("Receive spot in lottery signup, with multiple lottery program types", async ({
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

  const workshopTitle = "test workshop";
  const rpgTitle = "test rpg";

  await populateDb(request, {
    clean: true,
    admin: true,
  });
  await addUser(request, "test1");
  await addProgramItems(request, [
    {
      programItemId: testProgramItem.programItemId,
      programType: ProgramType.WORKSHOP,
      title: workshopTitle,
      startTime,
      endTime,
      // Adjust min/max so user can get the spot
      minAttendance: 1,
      maxAttendance: 1,
    },
    {
      programItemId: testProgramItem2.programItemId,
      programType: ProgramType.TABLETOP_RPG,
      title: rpgTitle,
      startTime,
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

  await page.click("data-testid=program-list-tab");

  const workshopProgramItem = page
    .locator('[data-testid="program-item-container"]')
    .filter({
      has: page.getByTestId("program-item-title"),
      hasText: workshopTitle,
    });
  await workshopProgramItem
    .getByRole("button", { name: /lottery sign-up/i })
    .click();
  await workshopProgramItem.getByRole("button", { name: /confirm/i }).click();

  const rpgProgramItem = page
    .locator('[data-testid="program-item-container"]')
    .filter({
      has: page.getByTestId("program-item-title"),
      hasText: rpgTitle,
    });
  await rpgProgramItem
    .getByRole("button", { name: /lottery sign-up/i })
    .click();
  await rpgProgramItem.getByRole("button", { name: /confirm/i }).click();

  // Do assignment on background
  await postAssignment(request, startTime);
  await page.reload();

  // Check new assigment message
  await expect(page.getByTestId("notification-bar")).toContainText(
    `You were assigned to the workshop ${workshopTitle}.`,
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    `You were assigned to the workshop ${workshopTitle}.`,
  );
});
