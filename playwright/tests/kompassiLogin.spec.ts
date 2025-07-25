import { test, expect } from "@playwright/test";
import { populateDb, postSettings } from "playwright/playwrightUtils";
import { LoginProvider } from "shared/config/eventConfigTypes";

test("Kompassi login", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.KOMPASSI });

  await page.goto("/");

  // Go to login page
  await page.click("data-testid=navigation-icon");
  await page.click("data-testid=login-page-link");

  await page
    .getByRole("button", {
      name: /login or create account/i,
    })
    .click();
  await page.waitForURL("/");

  await page.getByRole("checkbox", { name: /privacy policy/i }).check();
  await page.getByRole("button", { name: /save/i }).click();

  // Check if login was completed
  await page.click("data-testid=navigation-icon");

  const profileLink = page.locator("data-testid=link-profile");
  await expect(profileLink).toBeVisible();

  // Logout
  await page.getByRole("link", { name: /logout/i }).click();

  // Check if logout was completed
  await page.click("data-testid=navigation-icon");
  const loginLink = page.getByRole("link", { name: /login/i });
  await expect(loginLink).toBeVisible();
});
