import { test, expect } from "@playwright/test";
import { populateDb, login } from "playwright/utils";

test("Hide program item", async ({ page, request }) => {
  await populateDb(request);
  await login(page, request, { username: "admin", password: "test" });

  await page.goto("/");

  // Hide first program item
  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  const hiddenProgramItemTitle = await firstProgramItem
    .locator("data-testid=program-item-title")
    .textContent();

  await firstProgramItem.locator("data-testid=program-item-title").click();

  await page.getByRole("button", { name: /hide program item/i }).click();

  // Go back to program list to verify first item has changed
  await page.getByRole("link", { name: /back/i }).click();

  const firstProgramItemAfterHide = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  const visibleFirstProgramItemTitle = await firstProgramItemAfterHide
    .locator("data-testid=program-item-title")
    .textContent();

  expect(visibleFirstProgramItemTitle).not.toEqual(hiddenProgramItemTitle);

  // Reload page and verify first item is changed
  await page.reload();

  const visibleFirstProgramItemTitleAfterReload =
    await firstProgramItemAfterHide
      .locator("data-testid=program-item-title")
      .textContent();

  expect(visibleFirstProgramItemTitleAfterReload).not.toEqual(
    hiddenProgramItemTitle,
  );
});
