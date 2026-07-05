import { test, expect } from "@playwright/test";
import {
  addSerials,
  populateDb,
  postSettings,
} from "playwright/playwrightUtils";
import { RegistrationPage } from "playwright/pages/RegistrationPage";
import { LoginProvider } from "shared/config/eventConfigTypes";

test("Register a new account and finalize email notifications", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, admin: true });
  await postSettings(request, {
    loginProvider: LoginProvider.LOCAL,
    appOpen: true,
  });
  const [serial] = await addSerials(request, 1);

  await page.goto("/registration");

  const registrationPage = new RegistrationPage(page);

  await expect(registrationPage.createAccountHeading).toBeVisible();

  await registrationPage.usernameInput.fill("newuser");
  await registrationPage.passwordInput.fill("password");
  await registrationPage.serialInput.fill(serial);
  await registrationPage.descriptionCheckbox.check();
  await registrationPage.createAccount();

  // Registration auto-logs in and shows the finalize-registration email step
  await expect(registrationPage.emailNotificationsEnabled).toBeVisible();
  await registrationPage.emailNotificationsEnabled.check();
  await registrationPage.emailInput.fill("newuser@example.com");
  // Local accounts already chose their username and agreed to the privacy
  // policy on the previous page
  await expect(registrationPage.finalizeUsernameInput).toBeHidden();
  await expect(registrationPage.descriptionCheckbox).toBeHidden();
  await registrationPage.save();

  // The user ends up logged in
  await registrationPage.navigation.open();
  await expect(registrationPage.navigation.logoutLink).toBeVisible();
});

test("Show error for invalid registration code", async ({ page, request }) => {
  await populateDb(request, { clean: true, admin: true });
  await postSettings(request, {
    loginProvider: LoginProvider.LOCAL,
    appOpen: true,
  });

  await page.goto("/registration");

  const registrationPage = new RegistrationPage(page);

  await registrationPage.usernameInput.fill("newuser");
  await registrationPage.passwordInput.fill("password");
  await registrationPage.serialInput.fill("not-a-valid-code");
  await registrationPage.descriptionCheckbox.check();
  await registrationPage.createAccount();

  await expect(registrationPage.main).toContainText(
    "Invalid registration code",
  );
});

test("Show error when username is already taken", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, {
    loginProvider: LoginProvider.LOCAL,
    appOpen: true,
  });
  const [serial] = await addSerials(request, 1);

  await page.goto("/registration");

  const registrationPage = new RegistrationPage(page);

  // Username test1 is already taken by an existing user
  await registrationPage.usernameInput.fill("test1");
  await registrationPage.passwordInput.fill("password");
  await registrationPage.serialInput.fill(serial);
  await registrationPage.descriptionCheckbox.check();
  await registrationPage.createAccount();

  await expect(registrationPage.main).toContainText("Username already taken");
});

test("Show validation errors for too short username and password", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, admin: true });
  await postSettings(request, {
    loginProvider: LoginProvider.LOCAL,
    appOpen: true,
  });

  await page.goto("/registration");

  const registrationPage = new RegistrationPage(page);

  // USERNAME_LENGTH_MIN is 3 and PASSWORD_LENGTH_MIN is 4
  await registrationPage.usernameInput.fill("ab");
  await registrationPage.passwordInput.fill("abc");
  await registrationPage.serialInput.fill("12345");
  await registrationPage.descriptionCheckbox.check();
  await registrationPage.createAccount();

  await expect(registrationPage.main).toContainText(
    "Too short, at least 3 characters required",
  );
  await expect(registrationPage.main).toContainText(
    "Too short, at least 4 characters required",
  );
});
