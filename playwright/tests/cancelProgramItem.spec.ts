import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  postSettings,
  postTestSettings,
  login,
  addProgramItems,
  clearDb,
  populateDb,
} from "playwright/playwrightUtils";
import { config } from "shared/config";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { testProgramItem } from "shared/tests/testProgramItem";
import { SignupType, State } from "shared/types/models/programItem";

test("Show event log notification when program item with direct signup is cancelled", async ({
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
        .add(1, "hour")
        .startOf("hour")
        .toISOString(),
      state: State.CANCELLED,
    },
  ]);

  await page.reload();

  await expect(page.getByTestId("notification-bar")).toContainText(
    "Roleplaying game canceled: Test program item",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Roleplaying game canceled: Test program item",
  );
});

test("Show event log notification when program item with lottery signup is cancelled before its lottery has run", async ({
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

  await clearDb(request);
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
  });
  await addProgramItems(request, [
    {
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
  await page.click("data-testid=program-list-tab");

  // Lottery signup to first program item
  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  await firstProgramItem
    .getByRole("button", { name: /lottery sign-up/i })
    .click();
  await firstProgramItem.getByRole("button", { name: /confirm/i }).click();

  // Cancel program item on background before lottery has run
  await addProgramItems(request, [
    {
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      endTime,
      state: State.CANCELLED,
    },
  ]);

  await page.reload();

  await expect(page.getByTestId("notification-bar")).toContainText(
    "Roleplaying game canceled: Test program item",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Roleplaying game canceled: Test program item",
  );
});

test("Don't show event log notification when program item with lottery signup is cancelled after its lottery has run", async ({
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

  await clearDb(request);
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
  });
  await addProgramItems(request, [
    {
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
  await page.click("data-testid=program-list-tab");

  // Lottery signup to first program item
  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  await firstProgramItem
    .getByRole("button", { name: /lottery sign-up/i })
    .click();
  await firstProgramItem.getByRole("button", { name: /confirm/i }).click();

  // Advance time past lottery signup end so lottery is considered "run"
  await postTestSettings(request, {
    testTime: dayjs(startTime).subtract(1, "hour").toISOString(),
  });

  // Cancel program item on background after lottery has run
  await addProgramItems(request, [
    {
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      endTime,
      state: State.CANCELLED,
    },
  ]);

  await page.reload();

  // No cancellation notification should appear
  await expect(page.getByTestId("notification-bar")).toHaveCount(0);

  // Lottery signup is preserved as history in My Program
  await page.click("data-testid=my-program-tab");
  const lotterySignupProgramItems = page.locator(
    "data-testid=lottery-signup-program-items-list",
  );
  await expect(
    lotterySignupProgramItems.getByTestId("program-item-title"),
  ).toContainText("Test program item");
});

test("Show event log notification when program item with direct signup doesn't use Konsti anymore", async ({
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

  // Change program item signup type on background
  await addProgramItems(request, [
    {
      programItemId: testProgramItem.programItemId,
      startTime: dayjs(config.event().eventStartTime)
        .add(1, "hour")
        .startOf("hour")
        .toISOString(),
      signupType: SignupType.OTHER,
    },
  ]);

  await page.reload();

  await expect(page.getByTestId("notification-bar")).toContainText(
    "Roleplaying game canceled: Test program item",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Roleplaying game canceled: Test program item",
  );
});

test("Show event log notification when program item with direct signup is completely deleted", async ({
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
  await page.click("data-testid=program-list-tab");
  await page
    .getByRole("combobox", {
      name: /program type/i,
    })
    .selectOption("Tabletop RPG");

  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  await firstProgramItem.getByRole("button", { name: /sign up/i }).click();
  await firstProgramItem.getByRole("button", { name: /confirm/i }).click();

  await expect(page.getByTestId("program-item-container")).toContainText(
    "1/4 sign-ups",
  );

  // Delete program item on background (empty import removes it from DB)
  await addProgramItems(request, []);

  await page.reload();

  await expect(page.getByTestId("notification-bar")).toContainText(
    "Roleplaying game canceled: Test program item",
  );
});

test("Show event log notification and remove lottery signup when program item is completely deleted after its lottery has run", async ({
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

  await clearDb(request);
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
  });
  await addProgramItems(request, [
    {
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
  await page.click("data-testid=program-list-tab");

  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  await firstProgramItem
    .getByRole("button", { name: /lottery sign-up/i })
    .click();
  await firstProgramItem.getByRole("button", { name: /confirm/i }).click();

  // Advance time past lottery signup end so lottery is considered "run"
  await postTestSettings(request, {
    testTime: dayjs(startTime).subtract(1, "hour").toISOString(),
  });

  // Delete program item on background (empty import removes it from DB)
  await addProgramItems(request, []);

  await page.reload();

  // Deletion bypasses the preservation rule — notification still appears
  await expect(page.getByTestId("notification-bar")).toContainText(
    "Roleplaying game canceled: Test program item",
  );
});
