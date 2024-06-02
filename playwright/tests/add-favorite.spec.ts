import { test, expect } from "@playwright/test";
import { logTestStart, populateDb } from "./utils";

test("Add favorite", async ({ page, request }) => {
  logTestStart("Add favorite");
  await populateDb(request);

  const username = "test1";
  const password = "test";

  await page.goto("/");

  // Go to login page and enter login credentials
  await page.click("data-testid=navigation-icon");
  await page.click("data-testid=login-page-link");

  await page.fill("data-testid=login-form-input-username", username);
  await page.fill("data-testid=login-form-input-password", password);

  await page.click("data-testid=login-button");

  // Navigate to program list tab
  await page.click("data-testid=program-list-tab");

  // Favorite first program item
  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  const favoritedProgramItemTitle = await firstProgramItem
    .locator("data-testid=program-item-title")
    .innerText();

  await firstProgramItem.locator("data-testid=add-favorite-button").click();

  // Go to My Program and check favorited program item title
  await page.click("data-testid=my-program-tab");

  const favoritedProgramItems = page.locator(
    "data-testid=favorited-program-items-list",
  );

  const programItemTitle = await favoritedProgramItems
    .locator("data-testid=program-item-title")
    .innerText();

  expect(programItemTitle.trim()).toEqual(favoritedProgramItemTitle);
});
