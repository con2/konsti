import { test, expect } from "@playwright/test";
import { populateDb, login } from "playwright/playwrightUtils";

test("Logout clears the session", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  // Sanity check: logged in (Logout link present in navigation)
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Logout" }).click();

  // Session storage is cleared on logout
  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem("state")))
    .toBeNull();

  // Logged-out navigation offers a login link
  await page.getByTestId("navigation-icon").click();
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
});
