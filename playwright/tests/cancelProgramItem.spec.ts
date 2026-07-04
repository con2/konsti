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
import { ProgramListPage } from "playwright/pages/ProgramListPage";
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

  const programList = new ProgramListPage(page);

  // Navigate to program list tab and select RPG program type
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");

  // Direct signup to first program item
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  await firstProgramItem.signUp();
  await firstProgramItem.confirm();

  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");

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

  await expect(programList.notificationBar.bar).toContainText(
    "Role-playing game was cancelled and your sign-up was removed: Test program item",
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    "Role-playing game was cancelled and your sign-up was removed: Test program item",
  );
});

test("Show event log notification when program item with lottery sign-up is cancelled before its lottery has run", async ({
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

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();

  // Lottery signup to first program item
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirm();

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

  await expect(programList.notificationBar.bar).toContainText(
    "Role-playing game was cancelled and your sign-up was removed: Test program item",
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    "Role-playing game was cancelled and your sign-up was removed: Test program item",
  );
});

test("Show event log notification when program item with direct sign-up doesn't use Konsti anymore", async ({
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

  const programList = new ProgramListPage(page);

  // Navigate to program list tab and select RPG program type
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");

  // Direct signup to first program item
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  await firstProgramItem.signUp();
  await firstProgramItem.confirm();

  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");

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

  await expect(programList.notificationBar.bar).toContainText(
    "Role-playing game no longer uses Konsti sign-up and your sign-up was removed: Test program item",
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    "Role-playing game no longer uses Konsti sign-up and your sign-up was removed: Test program item",
  );
});

test("Show event log notification when program item with lottery sign-up doesn't use Konsti anymore before its lottery has run", async ({
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

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();

  // Lottery signup to first program item
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirm();

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

  await expect(programList.notificationBar.bar).toContainText(
    "Role-playing game no longer uses Konsti sign-up and your sign-up was removed: Test program item",
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    "Role-playing game no longer uses Konsti sign-up and your sign-up was removed: Test program item",
  );
});

test("Show event log notification when program item with direct sign-up is deleted", async ({
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

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");

  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  await firstProgramItem.signUp();
  await firstProgramItem.confirm();

  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");

  // Delete program item on background (empty import removes it from DB)
  await addProgramItems(request, []);

  await page.reload();

  await expect(programList.notificationBar.bar).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );
});

test("Show event log notification when program item with lottery sign-up is deleted before its lottery has run", async ({
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

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();

  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirm();

  // Delete program item on background (empty import removes it from DB)
  await addProgramItems(request, []);

  await page.reload();

  await expect(programList.notificationBar.bar).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );
});

test("Show event log notification when program item with lottery sign-up is deleted after its lottery has run", async ({
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

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();

  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirm();

  // Advance time past lottery signup end so lottery is considered "run"
  await postTestSettings(request, {
    testTime: dayjs(startTime).subtract(1, "hour").toISOString(),
  });

  // Delete program item on background (empty import removes it from DB)
  await addProgramItems(request, []);

  await page.reload();

  await expect(programList.notificationBar.bar).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );
});

test("Show event log notification when program item with lottery sign-up changes to a non-lottery program type before its lottery has run", async ({
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

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();

  // Lottery signup to first program item
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirm();

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

  await expect(programList.notificationBar.bar).toContainText(
    "Program item no longer uses lottery sign-up and your lottery sign-up was removed: Test program item",
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
    "Program item no longer uses lottery sign-up and your lottery sign-up was removed: Test program item",
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

  const programList = new ProgramListPage(page);

  // Navigate to program list tab and select RPG program type
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");

  // Favorite first program item (no signup) and wait for it to persist
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  const favoriteResponse = page.waitForResponse(
    (response) =>
      response.url().includes(ApiEndpoint.FAVORITE) &&
      response.request().method() === "POST",
  );
  await firstProgramItem.favorite();
  await favoriteResponse;

  // Delete program item on background (empty import removes it from DB)
  await addProgramItems(request, []);

  await page.reload();

  await expect(programList.notificationBar.bar).toContainText(
    "Program item was deleted and removed from your program: test-program-item",
  );

  await programList.notificationBar.showAllNotifications();
  await expect(programList.notificationBar.eventLogItem).toContainText(
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
