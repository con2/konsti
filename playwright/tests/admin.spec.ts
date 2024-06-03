import { test, expect } from "@playwright/test";
import { logTestStart, populateDb } from "playwright/utils";

test("Hide program item", async ({ page, request }) => {
  logTestStart("Hide program item");
  await populateDb(request);

  const username = "admin";
  const password = "test";

  await page.goto("/");

  // Go to login page and enter login credentials
  await page.click("data-testid=navigation-icon");
  await page.click("data-testid=login-page-link");

  await page.fill("data-testid=login-form-input-username", username);
  await page.fill("data-testid=login-form-input-password", password);

  await page.click("data-testid=login-button");

  // Hide first program item
  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  const hiddenProgramItemTitle = await firstProgramItem
    .locator("data-testid=program-item-title")
    .innerText();

  await firstProgramItem.locator("data-testid=program-item-title").click();

  await page.getByRole("button", { name: /hide program item/i }).click();

  // Go back to program list to verify first item has changed
  await page.getByRole("link", { name: /back/i }).click();

  const firstProgramItemAfterHide = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  const visibleFirstProgramItemTitle = await firstProgramItemAfterHide
    .locator("data-testid=program-item-title")
    .innerText();

  expect(visibleFirstProgramItemTitle).not.toEqual(hiddenProgramItemTitle);

  // Reload page and verify first item is changed
  await page.reload();

  const visibleFirstProgramItemTitleAfterReload =
    await firstProgramItemAfterHide
      .locator("data-testid=program-item-title")
      .innerText();

  expect(visibleFirstProgramItemTitleAfterReload).not.toEqual(
    hiddenProgramItemTitle,
  );
});
