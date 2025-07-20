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

test("Add lottery signup", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      startTime: dayjs(config.event().eventStartTime)
        .add(3, "hour")
        .startOf("hour")
        .toISOString(),
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

  await populateDb(request, {
    clean: true,
    admin: true,
  });
  await addUser(request, "test1");
  await addProgramItems(request, [
    {
      startTime,
      // Adjust min/max so user will get the seat
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
});

test("Did not receive spot in lottery signup", async ({ page, request }) => {
  const startTime = dayjs(config.event().eventStartTime)
    .add(4, "hour")
    .startOf("hour")
    .toISOString();

  await populateDb(request, {
    clean: true,
    admin: true,
  });
  await addUser(request, "test1");
  await addProgramItems(request, [
    {
      startTime,
      // Adjust min/max so user cannot get the seat
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
});
