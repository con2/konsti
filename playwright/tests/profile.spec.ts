import { test, expect } from "@playwright/test";
import { populateDb, login, postSettings } from "playwright/playwrightUtils";
import { LoginProvider } from "shared/config/eventConfigTypes";

test("Update email notification address and password from profile", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postSettings(request, { loginProvider: LoginProvider.LOCAL });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  await page.getByTestId("navigation-icon").click();
  await page.getByTestId("link-profile").click();

  // Profile shows the logged-in user
  await expect(page.locator("#main")).toContainText("test1");

  // Update email notification address
  await page.locator("#email-notifications-enabled").check();
  await page.locator("#email").fill("test1@example.com");
  await page.getByRole("button", { name: "Save" }).nth(0).click();
  await expect(page.locator("#main")).toContainText(
    "Email address updated successfully",
  );

  // Refresh the page and confirm the new email value is still set
  await page.reload();
  await expect(page.locator("#email")).toHaveValue("test1@example.com");

  // Change password
  await page.getByPlaceholder("New password").fill("newpassword");
  await page.getByRole("button", { name: "Save" }).nth(1).click();
  await expect(page.locator("#main")).toContainText(
    "Password changed successfully.",
  );

  // Log out and log back in through the form with the new password
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Logout" }).click();
  // Wait for logout to clear the session before reloading the login page
  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem("state")))
    .toBeNull();

  await page.goto("/login");
  await page.fill("data-testid=login-form-input-username", "test1");
  await page.fill("data-testid=login-form-input-password", "newpassword");
  await page.getByTestId("login-button").click();

  // Logged in again with the new password: navigation offers Logout
  await page.getByTestId("navigation-icon").click();
  await expect(page.getByRole("link", { name: "Logout" })).toBeVisible();
});
