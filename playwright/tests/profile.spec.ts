import { expect, test } from "@playwright/test";
import { LoginProvider } from "shared/config/eventConfigTypes";
import {
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
} from "shared/constants/validation";
import { LoginPage } from "playwright/pages/LoginPage";
import { ProfilePage } from "playwright/pages/ProfilePage";
import { login, populateDb, postSettings } from "playwright/playwrightUtils";

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

  // Change password. The field starts masked and the eye icon toggles it.
  await profilePage.newPasswordInput.fill("newpassword");
  await expect(profilePage.newPasswordInput).toHaveAttribute(
    "type",
    "password",
  );
  await profilePage.showPasswordToggle.click();
  await expect(profilePage.newPasswordInput).toHaveAttribute("type", "text");
  await profilePage.hidePasswordToggle.click();
  await expect(profilePage.newPasswordInput).toHaveAttribute(
    "type",
    "password",
  );

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

test("Show validation errors for email notification address and password", async ({
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

  // A password below the minimum length is rejected before it reaches the
  // server, so the success message must not appear
  await profilePage.newPasswordInput.fill("a".repeat(PASSWORD_LENGTH_MIN - 1));
  await profilePage.savePassword();
  await expect(profilePage.main).toContainText(
    `Too short, at least ${String(PASSWORD_LENGTH_MIN)} characters required`,
  );
  await expect(profilePage.main).not.toContainText(
    "Password changed successfully.",
  );

  // Same for one above the maximum length
  await profilePage.newPasswordInput.fill("a".repeat(PASSWORD_LENGTH_MAX + 1));
  await profilePage.savePassword();
  await expect(profilePage.main).toContainText(
    `Too long, at most ${String(PASSWORD_LENGTH_MAX)} characters allowed`,
  );
  await expect(profilePage.main).not.toContainText(
    "Password changed successfully.",
  );
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
  // user out.
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
