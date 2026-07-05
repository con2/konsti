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

  // Capture the title before navigating - after login both locators would
  // resolve to the same element, making the comparison self-referential
  const firstProgramItemTitle = await firstProgramItem.title.textContent();

  await firstProgramItem.title.click();
  await page.waitForURL("/program/item/*");

  await loginPage.loginToSignUpLink.click();
  await loginPage.fillAndSubmit(username, password);

  // Login should redirect back to the program item page
  await page.waitForURL("/program/item/*");

  const programItemTitle = await programItemPage.titleLink.textContent();
  expect(programItemTitle).toEqual(firstProgramItemTitle);
});
