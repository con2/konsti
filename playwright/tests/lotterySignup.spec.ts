import { test, expect } from "@playwright/test";
import {
  logTestStart,
  populateDb,
  postSettings,
  postTestSettings,
} from "playwright/utils";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { sharedConfig } from "shared/config/sharedConfig";

test("Add lottery signup", async ({ page, request }) => {
  logTestStart("Add lottery signup");
  await populateDb(request);
  await postSettings(request, { signupStrategy: SignupStrategy.ALGORITHM });
  await postTestSettings(request, {
    testTime: sharedConfig.conventionStartTime,
  });

  const username = "test1";
  const password = "test";

  await page.goto("/");

  // Go to login page and enter login credentials
  await page.click("data-testid=navigation-icon");
  await page.click("data-testid=login-page-link");

  await page.fill("data-testid=login-form-input-username", username);
  await page.fill("data-testid=login-form-input-password", password);

  await page.click("data-testid=login-button");

  // Navigate to program list tab and select RPG program type
  await page.click("data-testid=program-list-tab");
  await page
    .getByRole("combobox", {
      name: /program type/i,
    })
    .selectOption("Tabletop RPG");

  // Lottery signup to first program item
  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  const lotterySignupProgramItemTitle = await firstProgramItem
    .locator("data-testid=program-item-title")
    .innerText();

  await firstProgramItem
    .getByRole("button", { name: /lottery sign-up/i })
    .click();
  await firstProgramItem.getByRole("button", { name: /confirm/i }).click();

  // Go to My Program and check lottery signup program item title
  await page.click("data-testid=my-program-tab");

  const lotterySignupProgramItems = page.locator(
    "data-testid=lottery-signup-program-items-list",
  );

  const programItemTitle = await lotterySignupProgramItems
    .locator("data-testid=program-item-title")
    .innerText();

  expect(programItemTitle.trim()).toEqual(lotterySignupProgramItemTitle);
});
