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
