import { test, expect } from "@playwright/test";
import { logTestStart, populateDb } from "playwright/utils";

test("Login", async ({ page, request }) => {
  logTestStart("Admin login");
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

  // Check if login was completed
  await page.click("data-testid=navigation-icon");

  const link = page.getByRole("link", { name: /profile/i });
  await expect(link).toBeVisible();
});
