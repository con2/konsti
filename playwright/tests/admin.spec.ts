import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  populateDb,
  login,
  postSettings,
  postTestSettings,
  addProgramItems,
} from "playwright/playwrightUtils";
import { AdminPage } from "playwright/pages/AdminPage";
import { LoginPage } from "playwright/pages/LoginPage";
import { ProgramItemPage } from "playwright/pages/ProgramItemPage";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  EventSignupStrategy,
  LoginProvider,
} from "shared/config/eventConfigTypes";
import { SignupQuestionType } from "shared/types/models/settings";

test("Admin can open and close the app", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, {
    appOpen: true,
    loginProvider: LoginProvider.LOCAL,
  });
  await login(page, request, { username: "admin", password: "test" });

  const adminPage = new AdminPage(page);
  const loginPage = new LoginPage(page);

  await page.goto("/");
  await adminPage.open();

  await adminPage.closeKonsti();
  await expect(adminPage.openKonstiButton).toBeVisible();

  // While the app is closed, a normal user cannot log in through the form
  await adminPage.navigation.logout();
  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem("state")))
    .toBeNull();

  await page.goto("/login");
  await loginPage.fillAndSubmit("test1", "test");
  await expect(adminPage.main).toContainText("Login is disabled");

  // Admin can still log in while closed and re-open the app
  await login(page, request, { username: "admin", password: "test" });
  await page.goto("/");
  await adminPage.open();
  await adminPage.openKonsti();
  await expect(adminPage.closeKonstiButton).toBeVisible();
});

test("Admin can change the signup strategy", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await login(page, request, { username: "admin", password: "test" });

  const adminPage = new AdminPage(page);

  await page.goto("/");
  await adminPage.open();

  const strategySelect = adminPage.signupStrategySelect;
  await adminPage.selectSignupStrategy("Lottery");
  await expect(strategySelect.locator("option:checked")).toHaveText("Lottery");

  // Refresh and confirm the new strategy is still selected
  await page.reload();
  await expect(strategySelect.locator("option:checked")).toHaveText("Lottery");
});

test("Admin sees signup questions listed", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programItemId: "admin-question-item",
      title: "Admin Question Item",
      startTime: dayjs(config.event().eventStartTime)
        .add(1, "hour")
        .startOf("hour")
        .toISOString(),
    },
  ]);
  await postSettings(request, {
    signupQuestions: [
      {
        programItemId: "admin-question-item",
        questionFi: "Mikä on hahmoluokkasi?",
        questionEn: "What is your character class?",
        private: false,
        type: SignupQuestionType.TEXT,
        selectOptions: [],
      },
    ],
  });
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await login(page, request, { username: "admin", password: "test" });

  const adminPage = new AdminPage(page);

  await page.goto("/");
  await adminPage.open();

  await expect(page.getByText("What is your character class?")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Admin Question Item" }),
  ).toBeVisible();
});

test("Admin can trigger an assignment run", async ({ page, request }) => {
  const startTime = dayjs(config.event().eventStartTime)
    .add(4, "hour")
    .startOf("hour")
    .toISOString();

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      minAttendance: 1,
      maxAttendance: 1,
    },
  ]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await login(page, request, { username: "admin", password: "test" });

  const adminPage = new AdminPage(page);

  await page.goto("/");
  await adminPage.open();

  await adminPage.assignAttendees();

  // The admin view shows the assignment result, confirming the run completed
  await expect(adminPage.assignmentResult).toBeVisible();
});

test("Hide program item", async ({ page, request }) => {
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
  });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime: dayjs(config.event().eventStartTime).toISOString(),
    },
  ]);
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  await login(page, request, { username: "admin", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  const programItemPage = new ProgramItemPage(page);

  // Hide first program item
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  const hiddenProgramItemTitle = await firstProgramItem.title.textContent();
  if (!hiddenProgramItemTitle) {
    // eslint-disable-next-line no-restricted-syntax
    throw new Error("Program item title was null");
  }

  await firstProgramItem.title.click();

  await programItemPage.hide();

  // Go back to program list to verify program list is empty
  await programItemPage.goBack();
  await expect(programItemPage.main).toContainText(
    "No program items found, please check your search conditions.",
  );

  // Go to admin page and verify hidden program item is listed
  await programItemPage.navigation.gotoAdmin();
  await expect(
    page.getByRole("link", { name: hiddenProgramItemTitle }),
  ).toBeVisible();
});
