import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  addProgramItems,
  populateDb,
  postSettings,
  postTestSettings,
} from "playwright/playwrightUtils";
import { LoginPage } from "playwright/pages/LoginPage";
import { ProgramItemPage } from "playwright/pages/ProgramItemPage";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { RegistrationPage } from "playwright/pages/RegistrationPage";
import { LoginProvider } from "shared/config/eventConfigTypes";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { ProgramType } from "shared/types/models/programItem";

const programItemStartTime = dayjs(config.event().eventStartTime)
  .add(1, "hour")
  .startOf("hour")
  .toISOString();

test("Admin login", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    { ...testProgramItem, startTime: programItemStartTime },
  ]);
  await postSettings(request, { loginProvider: LoginProvider.LOCAL });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  const username = "admin";
  const password = "test";

  await page.goto("/");

  const loginPage = new LoginPage(page);
  const programList = new ProgramListPage(page);

  // Go to login page and enter login credentials
  await loginPage.navigation.gotoLoginPage();
  await loginPage.fillAndSubmit(username, password);

  // Check if login was completed - admin should be redirected to program list
  await expect(programList.firstItem().container).toBeVisible();

  await loginPage.navigation.open();
  await expect(loginPage.navigation.profileLink).toBeVisible();
});

test("User login", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    { ...testProgramItem, startTime: programItemStartTime },
  ]);
  await postSettings(request, { loginProvider: LoginProvider.LOCAL });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  const username = "test1";
  const password = "test";

  await page.goto("/");

  const loginPage = new LoginPage(page);
  const programList = new ProgramListPage(page);

  // Go to login page and enter login credentials
  await loginPage.navigation.gotoLoginPage();
  await loginPage.fillAndSubmit(username, password);

  // Check if login was completed - normal user should be redirected to profile
  await expect(programList.myProgramTab).toHaveClass(/active/);

  await loginPage.navigation.open();
  await expect(loginPage.navigation.profileLink).toBeVisible();
});

test("Show error when password is wrong", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.LOCAL });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  await page.goto("/login");

  const loginPage = new LoginPage(page);
  await loginPage.fillAndSubmit("test1", "wrong-password");

  await expect(loginPage.main).toContainText(
    "Username and password don't match",
  );

  // Editing the form clears the server error
  await loginPage.passwordInput.fill("new-attempt");
  await expect(loginPage.main).not.toContainText(
    "Username and password don't match",
  );
});

test("Show validation errors when submitting empty login form", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.LOCAL });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  await page.goto("/login");

  const loginPage = new LoginPage(page);
  await loginPage.loginButton.click();

  // Both username and password are required
  await expect(loginPage.main.getByText("Required")).toHaveCount(2);
});

test("Login and registration offer both Kompassi and Konsti accounts", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, admin: true });
  await postSettings(request, {
    loginProvider: LoginProvider.LOCAL_KOMPASSI,
    appOpen: true,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  await page.goto("/login");

  const loginPage = new LoginPage(page);

  // Both login methods are offered
  await expect(loginPage.main).toContainText(
    "You can log in to Konsti with either a Kompassi account or a Konsti account.",
  );
  await expect(loginPage.kompassiLoginButton).toBeVisible();
  await expect(loginPage.usernameInput).toBeVisible();

  // The registration page offers Kompassi login and the Konsti registration form
  await loginPage.main
    .getByRole("link", { name: "No account? Create one here." })
    .click();

  const registrationPage = new RegistrationPage(page);
  await expect(registrationPage.main).toContainText("Kompassi account");
  await expect(registrationPage.main).toContainText("Konsti account");
  await expect(loginPage.kompassiLoginButton).toBeVisible();
  await expect(registrationPage.usernameInput).toBeVisible();
  await expect(registrationPage.serialInput).toBeVisible();
});

test("Login redirect back to program item", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: ProgramType.TABLETOP_RPG,
      startTime: programItemStartTime,
    },
  ]);
  await postSettings(request, { loginProvider: LoginProvider.LOCAL });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  const username = "test1";
  const password = "test";

  await page.goto("/");

  const loginPage = new LoginPage(page);
  const programList = new ProgramListPage(page);
  const programItemPage = new ProgramItemPage(page);

  const firstProgramItem = programList.firstItem();

  await firstProgramItem.title.click();
  await page.waitForURL("/program/item/*");

  await loginPage.loginToSignUpLink.click();
  await loginPage.fillAndSubmit(username, password);

  const programItemTitle = await programItemPage.titleLink.textContent();

  expect(programItemTitle).toEqual(await firstProgramItem.title.textContent());
});
