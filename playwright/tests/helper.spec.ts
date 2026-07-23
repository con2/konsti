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
import { HelperPage } from "playwright/pages/HelperPage";
import { LoginPage } from "playwright/pages/LoginPage";
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
  await login(page, request, { username: "helper", password: "test" });
  await page.goto("/");

  const helperPage = new HelperPage(page);
  const loginPage = new LoginPage(page);

  await helperPage.open();

  // Find by a matching username
  await helperPage.findUser("test1");
  await expect(helperPage.main).toContainText("Found user");
  await expect(helperPage.main).toContainText("test1");

  // Read the registration code shown for the found user
  const foundUserText = await page.getByText(/Found user:/).textContent();
  const registrationCode = foundUserText?.match(/\(([^)]+)\)/)?.[1];
  if (!registrationCode) {
    // eslint-disable-next-line no-restricted-syntax
    throw new Error("Could not read the registration code");
  }

  // Registration code is displayed with hyphens, e.g. 012-304-800-1
  expect(registrationCode).toMatch(/^\d{3}-\d{3}-\d{3}-\d$/);

  // A non-matching username is not found
  await helperPage.findUser("nonexistentuser");
  await expect(helperPage.main).toContainText("User not found");

  // Find the same user by their registration code, using the hyphenated
  // form shown in the UI to confirm the lookup accepts it
  await helperPage.findUser(registrationCode);
  await expect(helperPage.main).toContainText("Found user");
  await expect(helperPage.main).toContainText("test1");

  // The helper flow manages only the found user's password — it must not expose an email
  // field (those settings act on the logged-in helper's own account, not the found user)
  await expect(helperPage.emailInput).toHaveCount(0);

  // Change the found user's password
  await helperPage.changePassword("newpassword1234");
  await expect(helperPage.main).toContainText("Password changed successfully.");

  // The user can log in with the new password
  await helperPage.navigation.logout();
  await page.goto("/login");
  await loginPage.fillAndSubmit("test1", "newpassword1234");

  await loginPage.navigation.open();
  await expect(loginPage.navigation.logoutLink).toBeVisible();
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
  });

  // signup-message endpoint is helper-only, so sign in as a helper here
  await login(page, request, { username: "helper", password: "test" });
  await page.goto("/");

  const helperPage = new HelperPage(page);

  await helperPage.open();
  await helperPage.openSignupAnswers();

  await expect(helperPage.main).toContainText("What is your character class?");
  await expect(helperPage.main).toContainText("Wizard");
});
