import { Page, expect, test } from "@playwright/test";
import { LoginProvider } from "shared/config/eventConfigTypes";
import { AuthEndpoint } from "shared/constants/apiEndpoints";
import { kompassiLoginStateKey } from "shared/constants/browserStorage";
import { LoginPage } from "playwright/pages/LoginPage";
import { ProfilePage } from "playwright/pages/ProfilePage";
import { populateDb, postSettings } from "playwright/playwrightUtils";

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

  await profilePage.privacyNoticeCheckbox.check();
  await profilePage.save();

  // Check if login was completed and modified username and email saved
  await profilePage.navigation.gotoProfile();
  await expect(profilePage.main).toContainText(`User: ${editedUsername}`);
  await expect(profilePage.emailInput).toHaveValue(editedEmail);

  // Kompassi accounts have no registration code, so the first-login notice
  // is not shown
  await expect(profilePage.firstLoginNotice).toBeHidden();

  // Profile shows no registration code and no password change form either:
  // Kompassi accounts reset their password via Kompassi
  await expect(profilePage.main).not.toContainText("Code:");
  await expect(profilePage.newPasswordInput).toHaveCount(0);

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
  await profilePage.privacyNoticeCheckbox.check();
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

  // Too short username, invalid email, and privacy notice not agreed to
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
  await profilePage.privacyNoticeCheckbox.check();
  await profilePage.save();

  // No email is stored for the user
  await profilePage.navigation.gotoProfile();
  await expect(profilePage.emailNotificationsDisabled).toBeChecked();
  await expect(profilePage.emailInput).toHaveValue("");
});

// The state check is the only thing standing between a forged callback and a
// minted session, and it lives entirely in the client
test("Rejects a Kompassi callback that no login here started", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.KOMPASSI });

  let codeExchanges = 0;
  page.on("request", (pageRequest) => {
    if (
      pageRequest.method() === "POST" &&
      pageRequest.url().includes(AuthEndpoint.KOMPASSI_LOGIN_CALLBACK)
    ) {
      codeExchanges += 1;
    }
  });

  // No login was started in this tab, so nothing holds a matching state
  await page.goto(
    `${AuthEndpoint.KOMPASSI_LOGIN_CALLBACK}?code=forged-code&state=forged-state`,
  );

  const loginPage = new LoginPage(page);
  await page.waitForURL(/login/);
  await expect(loginPage.main).toContainText(/don't match/i);

  // The code must never reach the server, whatever the UI ends up showing
  expect(codeExchanges).toEqual(0);
});

// The forged-callback test above covers arriving with nothing stored. This is
// the other branch: a login was started here, but the state coming back is not
// the one it started with
test("Rejects a Kompassi callback whose state does not match the stored one", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.KOMPASSI });

  let codeExchanges = 0;
  page.on("request", (pageRequest) => {
    if (
      pageRequest.method() === "POST" &&
      pageRequest.url().includes(AuthEndpoint.KOMPASSI_LOGIN_CALLBACK)
    ) {
      codeExchanges += 1;
    }
  });

  // Seeded before the only navigation: loading the app first and leaving it
  // mid-boot makes the abandoned page reload itself, and on WebKit that
  // reload interrupts the navigation below
  await page.addInitScript((key) => {
    sessionStorage.setItem(key, "the-state-we-started-with");
  }, kompassiLoginStateKey);

  await page.goto(
    `${AuthEndpoint.KOMPASSI_LOGIN_CALLBACK}?code=forged-code&state=some-other-state`,
  );

  const loginPage = new LoginPage(page);
  await page.waitForURL(/login/);
  await expect(loginPage.main).toContainText(/don't match/i);
  expect(codeExchanges).toEqual(0);
});

// The state has to be single use, or a denied login leaves one behind that a
// later forged callback could satisfy
test("Drops the stored login state when Kompassi returns an error", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.KOMPASSI });

  // The redirect to the login page that follows is client side, so this runs
  // once and cannot put the state back after the callback drops it
  await page.addInitScript((key) => {
    sessionStorage.setItem(key, "the-state-we-started-with");
  }, kompassiLoginStateKey);

  // What Kompassi sends back when the user declines, or has no verified email
  await page.goto(
    `${AuthEndpoint.KOMPASSI_LOGIN_CALLBACK}?error=access_denied&state=the-state-we-started-with`,
  );
  await page.waitForURL(/login/);

  const storedState = await page.evaluate(
    (key) => sessionStorage.getItem(key),
    kompassiLoginStateKey,
  );
  expect(storedState).toBeNull();
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

  await profilePage.privacyNoticeCheckbox.check();
  await profilePage.save();
  await profilePage.navigation.logout();

  // The same Kompassi account logs in again without the finalize form
  await loginWithKompassi(page);

  await expect(profilePage.privacyNoticeCheckbox).toBeHidden();
  await profilePage.navigation.open();
  await expect(profilePage.navigation.profileLink).toBeVisible();
});
