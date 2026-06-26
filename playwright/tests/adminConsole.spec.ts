import { test, expect, Page } from "@playwright/test";
import dayjs from "dayjs";
import {
  populateDb,
  login,
  postSettings,
  postTestSettings,
  addProgramItems,
} from "playwright/playwrightUtils";
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
  await openAdmin(page);

  await page.getByRole("button", { name: "Close Konsti" }).click();
  await expect(page.getByRole("button", { name: "Open Konsti" })).toBeVisible();

  // While the app is closed, a normal user cannot log in through the form
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Logout" }).click();
  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem("state")))
    .toBeNull();

  await page.goto("/login");
  await page.fill("data-testid=login-form-input-username", "test1");
  await page.fill("data-testid=login-form-input-password", "test");
  await page.getByTestId("login-button").click();
  await expect(page.locator("#main")).toContainText("Login is disabled");

  // Admin can still log in while closed and re-open the app
  await login(page, request, { username: "admin", password: "test" });
  await openAdmin(page);
  await page.getByRole("button", { name: "Open Konsti" }).click();
  await expect(
    page.getByRole("button", { name: "Close Konsti" }),
  ).toBeVisible();
});

test("Admin can change the signup strategy", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await login(page, request, { username: "admin", password: "test" });
  await openAdmin(page);

  const strategySelect = page.locator(
    'select:has(option:has-text("Lottery + Direct"))',
  );
  await strategySelect.selectOption({ label: "Lottery" });
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
  await openAdmin(page);

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
  await openAdmin(page);

  await page.getByRole("button", { name: "Assign attendees" }).click();

  // The admin view shows the assignment result, confirming the run completed
  await expect(page.getByText(/Assignment Result/)).toBeVisible();
});

const openAdmin = async (page: Page): Promise<void> => {
  await page.goto("/");
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Admin", exact: true }).click();
};
