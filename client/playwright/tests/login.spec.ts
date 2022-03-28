import { test, expect } from "@playwright/test";
import { populateDb } from "./populateDb";

test("Login", async ({ page, context }) => {
  await populateDb();

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

  const text = await page.innerText("data-testid=logged-user-username");
  expect(text).toBe(`User: ${username}`);
});
