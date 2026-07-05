import { test, expect, Page } from "@playwright/test";
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

const loginWithKompassi = async (page: Page): Promise<void> => {
  const loginPage = new LoginPage(page);
  await loginPage.navigation.gotoLoginPage();
  await loginPage.kompassiLoginButton.click();
  await page.waitForURL("/");
};

test("Show error when Kompassi username is already taken", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.KOMPASSI });

  await page.goto("/");
  await loginWithKompassi(page);

  const profilePage = new ProfilePage(page);

  // test1 exists as a local account
  await profilePage.usernameInput.fill("test1");
  await profilePage.privacyPolicyCheckbox.check();
  await profilePage.save();

  await expect(profilePage.main).toContainText("Username already taken");

  // Editing the username clears the error, and a free username completes login
  await profilePage.usernameInput.fill("free_username");
  await expect(profilePage.main).not.toContainText("Username already taken");

  await profilePage.save();
  await profilePage.navigation.gotoProfile();
  await expect(profilePage.main).toContainText("User: free_username");
});

test("Show validation errors on the Kompassi finalize form", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.KOMPASSI });

  await page.goto("/");
  await loginWithKompassi(page);

  const profilePage = new ProfilePage(page);

  // Too short username, invalid email, and privacy policy not agreed to
  await profilePage.usernameInput.fill("ab");
  await profilePage.emailInput.fill("not-an-email");
  await profilePage.save();

  await expect(profilePage.main).toContainText(
    "Too short, at least 3 characters required",
  );
  await expect(profilePage.main).toContainText("Invalid email format");
  await expect(profilePage.main).toContainText("Required");
});

test("Decline email notifications on the Kompassi finalize form", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.KOMPASSI });

  await page.goto("/");
  await loginWithKompassi(page);

  const profilePage = new ProfilePage(page);

  // Keep the default username and decline email notifications
  await profilePage.emailNotificationsDisabled.check();
  await profilePage.privacyPolicyCheckbox.check();
  await profilePage.save();

  // No email is stored for the user
  await profilePage.navigation.gotoProfile();
  await expect(profilePage.emailNotificationsDisabled).toBeChecked();
  await expect(profilePage.emailInput).toHaveValue("");
});

test("Second Kompassi login skips the finalize form", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.KOMPASSI });

  await page.goto("/");
  await loginWithKompassi(page);

  const profilePage = new ProfilePage(page);

  await profilePage.privacyPolicyCheckbox.check();
  await profilePage.save();
  await profilePage.navigation.logout();

  // The same Kompassi account logs in again without the finalize form
  await loginWithKompassi(page);

  await expect(profilePage.privacyPolicyCheckbox).toBeHidden();
  await profilePage.navigation.open();
  await expect(profilePage.navigation.profileLink).toBeVisible();
});
