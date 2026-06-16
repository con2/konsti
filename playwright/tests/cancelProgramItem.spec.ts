import { test, expect, APIRequestContext } from "@playwright/test";
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
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  ProgramType,
  SignupType,
  State,
} from "shared/types/models/programItem";

test("Show event log notification when program item with direct signup is cancelled", async ({
  page,
  request,
}) => {
  await initDb(request);
  const startTime = getStartTime("direct");
  const endTime = getEndTime(startTime);

  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime,
      endTime,
    },
  ]);

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
      ...testProgramItem,
      state: State.CANCELLED,
      startTime,
      endTime,
    },
  ]);

  await page.reload();

  await expect(page.getByTestId("notification-bar")).toContainText(
    "Roleplaying game was cancelled and your signup was removed: Test program item",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Roleplaying game was cancelled and your signup was removed: Test program item",
  );
});

test("Show event log notification when program item with lottery signup is cancelled before its lottery has run", async ({
  page,
  request,
}) => {
  await initDb(request);
  const startTime = getStartTime("lottery");
  const endTime = getEndTime(startTime);

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
      ...testProgramItem,
      state: State.CANCELLED,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      endTime,
    },
  ]);

  await page.reload();

  await expect(page.getByTestId("notification-bar")).toContainText(
    "Roleplaying game was cancelled and your signup was removed: Test program item",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Roleplaying game was cancelled and your signup was removed: Test program item",
  );
});

test("Show event log notification when program item with direct signup doesn't use Konsti anymore", async ({
  page,
  request,
}) => {
  await initDb(request);
  const startTime = getStartTime("direct");
  const endTime = getEndTime(startTime);

  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime,
      endTime,
    },
  ]);

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
      ...testProgramItem,
      signupType: SignupType.OTHER,
      startTime,
      endTime,
    },
  ]);

  await page.reload();

  await expect(page.getByTestId("notification-bar")).toContainText(
    "Roleplaying game no longer uses Konsti signup and your signup was removed: Test program item",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Roleplaying game no longer uses Konsti signup and your signup was removed: Test program item",
  );
});

test("Show event log notification when program item with lottery signup doesn't use Konsti anymore before its lottery has run", async ({
  page,
  request,
}) => {
  await initDb(request);
  const startTime = getStartTime("lottery");
  const endTime = getEndTime(startTime);

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

  // Change signup type away from Konsti on background before lottery has run
  await addProgramItems(request, [
    {
      ...testProgramItem,
      signupType: SignupType.OTHER,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      endTime,
    },
  ]);

  await page.reload();

  await expect(page.getByTestId("notification-bar")).toContainText(
    "Roleplaying game no longer uses Konsti signup and your signup was removed: Test program item",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Roleplaying game no longer uses Konsti signup and your signup was removed: Test program item",
  );
});

test("Show event log notification when program item with direct signup is deleted", async ({
  page,
  request,
}) => {
  await initDb(request);
  const startTime = getStartTime("direct");
  const endTime = getEndTime(startTime);

  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime,
      endTime,
    },
  ]);

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
    "Program item was deleted and removed from your program: test-program-item",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );
});

test("Show event log notification when program item with lottery signup is deleted before its lottery has run", async ({
  page,
  request,
}) => {
  await initDb(request);
  const startTime = getStartTime("lottery");
  const endTime = getEndTime(startTime);

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

  // Delete program item on background (empty import removes it from DB)
  await addProgramItems(request, []);

  await page.reload();

  await expect(page.getByTestId("notification-bar")).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );
});

test("Show event log notification when program item with lottery signup is deleted after its lottery has run", async ({
  page,
  request,
}) => {
  await initDb(request);
  const startTime = getStartTime("lottery");
  const endTime = getEndTime(startTime);

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

  await expect(page.getByTestId("notification-bar")).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );
});

test("Show event log notification when program item with lottery signup changes to a non-lottery program type before its lottery has run", async ({
  page,
  request,
}) => {
  await initDb(request);
  const startTime = getStartTime("lottery");
  const endTime = getEndTime(startTime);

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

  // Change program type to a non-lottery type on background before lottery has run
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: ProgramType.OTHER,
      startTime,
      endTime,
    },
  ]);

  await page.reload();

  await expect(page.getByTestId("notification-bar")).toContainText(
    "Program item no longer uses lottery signup and your lottery signup was removed: Test program item",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Program item no longer uses lottery signup and your lottery signup was removed: Test program item",
  );
});

test("Show event log notification when a favorited program item is deleted", async ({
  page,
  request,
}) => {
  await initDb(request);
  const startTime = getStartTime("direct");
  const endTime = getEndTime(startTime);

  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime,
      endTime,
    },
  ]);

  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  // Navigate to program list tab and select RPG program type
  await page.click("data-testid=program-list-tab");
  await page
    .getByRole("combobox", {
      name: /program type/i,
    })
    .selectOption("Tabletop RPG");

  // Favorite first program item (no signup) and wait for it to persist
  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  const favoriteResponse = page.waitForResponse(
    (response) =>
      response.url().includes(ApiEndpoint.FAVORITE) &&
      response.request().method() === "POST",
  );
  await firstProgramItem.locator("data-testid=add-favorite-button").click();
  await favoriteResponse;

  // Delete program item on background (empty import removes it from DB)
  await addProgramItems(request, []);

  await page.reload();

  await expect(page.getByTestId("notification-bar")).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );

  await page.getByRole("link", { name: "Show all notifications" }).click();
  await expect(page.getByTestId("event-log-item")).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );
});

const initDb = async (request: APIRequestContext): Promise<void> => {
  await clearDb(request);
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
};

const getStartTime = (type: "lottery" | "direct"): string => {
  return dayjs(config.event().eventStartTime)
    .add(type === "direct" ? 1 : 3, "hour") // -> direct signup
    .startOf("hour")
    .toISOString();
};

const getEndTime = (startTime: string): string => {
  return dayjs(startTime).add(testProgramItem.mins, "minutes").toISOString();
};
