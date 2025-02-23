import { test, expect } from "@playwright/test";
import { logTestStart, populateDb, login } from "playwright/utils";

test("Add favorite", async ({ page, request }) => {
  logTestStart("Add favorite");
  await populateDb(request);
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  // Navigate to program list tab
  await page.click("data-testid=program-list-tab");

  // Favorite first program item
  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  const favoriteProgramItemTitle = await firstProgramItem
    .locator("data-testid=program-item-title")
    .textContent();

  await firstProgramItem.locator("data-testid=add-favorite-button").click();

  // Go to My Program and check favorite program item title
  await page.click("data-testid=my-program-tab");

  const favoriteProgramItems = page.locator(
    "data-testid=favorite-program-items-list",
  );

  const programItemTitle = await favoriteProgramItems
    .locator("data-testid=program-item-title")
    .textContent();

  expect(programItemTitle?.trim()).toEqual(favoriteProgramItemTitle);
});
