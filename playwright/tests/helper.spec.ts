import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  populateDb,
  login,
  postSettings,
  postTestSettings,
  addProgramItems,
  testPostDirectSignup,
} from "playwright/playwrightUtils";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  EventSignupStrategy,
  LoginProvider,
} from "shared/config/eventConfigTypes";
import { SignupQuestionType } from "shared/types/models/settings";

test("Helper can find a user and change their password", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.LOCAL });
  await login(page, request, { username: "admin", password: "test" });
  await page.goto("/");

  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Helper", exact: true }).click();

  const search = page.getByPlaceholder("Registration code or username");

  // Find by a matching username
  await search.fill("test1");
  await page.getByRole("button", { name: "Find" }).click();
  await expect(page.locator("#main")).toContainText("Found user");
  await expect(page.locator("#main")).toContainText("test1");

  // Read the registration code shown for the found user
  const foundUserText = await page.getByText(/Found user:/).textContent();
  const registrationCode = foundUserText?.match(/\(([^)]+)\)/)?.[1];
  if (!registrationCode) {
    // eslint-disable-next-line no-restricted-syntax
    throw new Error("Could not read the registration code");
  }

  // A non-matching username is not found
  await search.fill("nonexistentuser");
  await page.getByRole("button", { name: "Find" }).click();
  await expect(page.locator("#main")).toContainText("User not found");

  // Find the same user by their registration code
  await search.fill(registrationCode);
  await page.getByRole("button", { name: "Find" }).click();
  await expect(page.locator("#main")).toContainText("Found user");
  await expect(page.locator("#main")).toContainText("test1");

  // Change the found user's password (password Save is the second Save button)
  await page.getByPlaceholder("New password").fill("newpassword1234");
  await page.getByRole("button", { name: "Save" }).nth(1).click();
  await expect(page.locator("#main")).toContainText(
    "Password changed successfully.",
  );

  // The user can log in with the new password
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Logout" }).click();
  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem("state")))
    .toBeNull();

  await page.goto("/login");
  await page.fill("data-testid=login-form-input-username", "test1");
  await page.fill("data-testid=login-form-input-password", "newpassword1234");
  await page.getByTestId("login-button").click();

  await page.getByTestId("navigation-icon").click();
  await expect(page.getByRole("link", { name: "Logout" })).toBeVisible();
});

test("Helper can view private signup question answers", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programItemId: "helper-message-item",
      title: "Private Question Item",
      startTime: dayjs(config.event().eventStartTime)
        .add(1, "hour")
        .startOf("hour")
        .toISOString(),
    },
  ]);
  await postSettings(request, {
    loginProvider: LoginProvider.LOCAL,
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
    signupQuestions: [
      {
        programItemId: "helper-message-item",
        questionFi: "Mikä on hahmoluokkasi?",
        questionEn: "What is your character class?",
        private: true,
        type: SignupQuestionType.TEXT,
        selectOptions: [],
      },
    ],
  });
  await postTestSettings(request, { testTime: config.event().eventStartTime });

  await testPostDirectSignup(request, "test1", {
    directSignupProgramItemId: "helper-message-item",
    message: "Wizard",
    priority: 0,
  });

  // signup-message endpoint is helper-only, so sign in as a helper here
  await login(page, request, { username: "helper", password: "test" });
  await page.goto("/");

  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Helper", exact: true }).click();
  await page.getByRole("button", { name: "Sign-up question answers" }).click();

  await expect(page.locator("#main")).toContainText(
    "What is your character class?",
  );
  await expect(page.locator("#main")).toContainText("Wizard");
});
