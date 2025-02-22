import { test, expect } from "@playwright/test";
import {
  logTestStart,
  populateDb,
  postTestSettings,
  login,
} from "playwright/utils";
import { config } from "shared/config";

test("Add direct signup", async ({ page, request }) => {
  logTestStart("Add direct signup");
  await populateDb(request);
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  // Navigate to program list tab and select RPG program type
  await page.click("data-testid=program-list-tab");
  await page
    .getByRole("combobox", {
      name: /program type/i,
    })
    .selectOption("Tabletop RPG");

  // Direct signup to first program item
  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  const directSignupProgramItemTitle = await firstProgramItem
    .locator("data-testid=program-item-title")
    .textContent();

  await firstProgramItem.getByRole("button", { name: /sign up/i }).click();
  await firstProgramItem.getByRole("button", { name: /confirm/i }).click();

  // Go to My Program and check direct signup program item title
  await page.click("data-testid=my-program-tab");

  const directSignupProgramItems = page.locator(
    "data-testid=direct-signup-program-items-list",
  );

  const programItemTitle = await directSignupProgramItems
    .locator("data-testid=program-item-title")
    .textContent();

  expect(programItemTitle?.trim()).toEqual(directSignupProgramItemTitle);
});
