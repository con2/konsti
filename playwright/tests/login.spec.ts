import { test, expect } from "@playwright/test";
import { populateDb } from "playwright/utils";

test("Admin login", async ({ page, request }) => {
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

  // Check if login was completed - admin should be redirected to program list
  const firstProgramItem = page.getByTestId("program-item-container").nth(0);
  await expect(firstProgramItem).toBeVisible();

  await page.click("data-testid=navigation-icon");
  const link = page.getByRole("link", { name: /profile/i });
  await expect(link).toBeVisible();
});

test("User login", async ({ page, request }) => {
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

  // Check if login was completed - normal user should be redirected to profile
  const myProgramTab = page.getByTestId("my-program-tab");
  await expect(myProgramTab).toHaveClass(/active/);

  await page.click("data-testid=navigation-icon");
  const link = page.getByRole("link", { name: /profile & group/i });
  await expect(link).toBeVisible();
});
