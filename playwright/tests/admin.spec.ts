import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  populateDb,
  login,
  addProgramItems,
  postTestSettings,
} from "playwright/playwrightUtils";
import { config } from "shared/config";

test("Hide program item", async ({ page, request }) => {
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
  });
  await addProgramItems(request, [
    {
      startTime: dayjs(config.event().eventStartTime).toISOString(),
    },
  ]);
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

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
  if (!hiddenProgramItemTitle) {
    // eslint-disable-next-line no-restricted-syntax
    throw new Error("Program item title was null");
  }

  await firstProgramItem.locator("data-testid=program-item-title").click();

  await page.getByRole("button", { name: /hide program item/i }).click();

  // Go back to program list to verify program list is empty
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page.locator("#main")).toContainText(
    "No program items found, please check your search conditions.",
  );

  // Go to admin page and verify hidden program item is listed
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(
    page.getByRole("link", { name: hiddenProgramItemTitle }),
  ).toBeVisible();
});
