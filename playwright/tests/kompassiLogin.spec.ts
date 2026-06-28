import { test, expect } from "@playwright/test";
import { populateDb, postSettings } from "playwright/playwrightUtils";
import { LoginPage } from "playwright/pages/LoginPage";
import { ProfilePage } from "playwright/pages/ProfilePage";
import { LoginProvider } from "shared/config/eventConfigTypes";

test("Kompassi login", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.KOMPASSI });

  await page.goto("/");

  const loginPage = new LoginPage(page);
  const profilePage = new ProfilePage(page);

  // Go to login page
  await loginPage.navigation.gotoLoginPage();

  await loginPage.kompassiLoginButton.click();
  await page.waitForURL("/");

  const editedUsername = "nickname_edited";
  await profilePage.usernameInput.fill(editedUsername);

  const editedEmail = "firstname.lastname.edited@example.com";
  await profilePage.emailInput.fill(editedEmail);

  await profilePage.privacyPolicyCheckbox.check();
  await profilePage.save();

  // Check if login was completed and modified username and email saved
  await profilePage.navigation.gotoProfile();
  await expect(profilePage.main).toContainText(`User: ${editedUsername}`);
  await expect(profilePage.emailInput).toHaveValue(editedEmail);

  // Logout
  await profilePage.navigation.logout();

  // Check if logout was completed
  await profilePage.navigation.open();
  await expect(profilePage.navigation.loginLink).toBeVisible();
});
