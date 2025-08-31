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

  const editedUsername = "nickname_edited";
  await page.getByTestId("login-form-input-username").fill(editedUsername);

  const editedEmail = "firstname.surname.edited@gmail.com";
  await page.locator("#email").fill(editedEmail);

  await page.getByRole("checkbox", { name: /privacy policy/i }).check();
  await page.getByRole("button", { name: /save/i }).click();

  // Check if login was completed and modified username and email saved
  await page.click("data-testid=navigation-icon");
  await page.getByTestId("link-profile").click();
  await expect(page.locator("#main")).toContainText(`User: ${editedUsername}`);
  await expect(page.locator("#email")).toHaveValue(editedEmail);

  // Logout
  await page.click("data-testid=navigation-icon");
  await page.getByRole("link", { name: /logout/i }).click();

  // Check if logout was completed
  await page.click("data-testid=navigation-icon");
  const loginLink = page.getByRole("link", { name: /login/i });
  await expect(loginLink).toBeVisible();
});
