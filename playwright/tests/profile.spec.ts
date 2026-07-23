import { test, expect } from "@playwright/test";
import { populateDb, login, postSettings } from "playwright/playwrightUtils";
import { LoginPage } from "playwright/pages/LoginPage";
import { ProfilePage } from "playwright/pages/ProfilePage";
import { LoginProvider } from "shared/config/eventConfigTypes";

test("Update email notification address and password from profile", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.LOCAL });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const profilePage = new ProfilePage(page);
  const loginPage = new LoginPage(page);

  await profilePage.navigation.gotoProfile();

  // Profile shows the logged-in user
  await expect(profilePage.main).toContainText("test1");

  // Registration code is displayed with hyphens, e.g. 012-304-800-1
  await expect(profilePage.main).toContainText(/Code: \d{3}-\d{3}-\d{3}-\d/);

  // Update email notification address
  await profilePage.emailNotificationsEnabled.check();
  await profilePage.emailInput.fill("test1@example.com");
  await profilePage.saveEmail();
  await expect(profilePage.main).toContainText(
    "Email address updated successfully",
  );

  // Refresh the page and confirm the new email value is still set
  await page.reload();
  await expect(profilePage.emailInput).toHaveValue("test1@example.com");

  // Change password
  await profilePage.newPasswordInput.fill("newpassword");
  await profilePage.savePassword();
  await expect(profilePage.main).toContainText(
    "Password changed successfully.",
  );

  // Log out and log back in through the form with the new password
  await profilePage.navigation.logout();
  await page.goto("/login");
  await loginPage.fillAndSubmit("test1", "newpassword");

  // Logged in again with the new password: navigation offers Logout
  await loginPage.navigation.open();
  await expect(loginPage.navigation.logoutLink).toBeVisible();
});

test("Show validation errors for email notification address", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.LOCAL });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const profilePage = new ProfilePage(page);

  await profilePage.navigation.gotoProfile();

  // Email address is required when notifications are enabled
  await profilePage.emailNotificationsEnabled.check();
  await profilePage.emailInput.fill("");
  await profilePage.saveEmail();
  await expect(profilePage.main).toContainText("Required");

  // Editing the email dismisses the previous validation message
  await profilePage.emailInput.fill("not-an-email");
  await expect(profilePage.main).not.toContainText("Required");

  await profilePage.saveEmail();
  await expect(profilePage.main).toContainText("Invalid email format");
});

test("Decline email notifications from profile", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.LOCAL });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const profilePage = new ProfilePage(page);

  await profilePage.navigation.gotoProfile();

  // Set an email address first
  await profilePage.emailNotificationsEnabled.check();
  await profilePage.emailInput.fill("test1@example.com");
  await profilePage.saveEmail();
  await expect(profilePage.main).toContainText(
    "Email address updated successfully",
  );

  // Toggling the notification setting dismisses the first save's message, so
  // the success assertion below can only match the second save's message.
  // That matters: it keeps the reload from happening while the save's
  // session restore is still in flight, which would abort it and log the
  // user out
  await profilePage.emailNotificationsDisabled.check();
  await expect(profilePage.main).not.toContainText(
    "Email address updated successfully",
  );

  // Declining notifications clears the stored email address
  await profilePage.saveEmail();
  await expect(profilePage.main).toContainText(
    "Email address updated successfully",
  );

  await page.reload();
  await expect(profilePage.emailNotificationsDisabled).toBeChecked();
  await expect(profilePage.emailInput).toHaveValue("");
});
