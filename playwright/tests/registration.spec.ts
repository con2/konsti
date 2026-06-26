import { test, expect } from "@playwright/test";
import {
  addSerials,
  populateDb,
  postSettings,
} from "playwright/playwrightUtils";
import { LoginProvider } from "shared/config/eventConfigTypes";

test("Register a new account and finalize email notifications", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, admin: true });
  await postSettings(request, {
    loginProvider: LoginProvider.LOCAL,
    appOpen: true,
  });
  const [serial] = await addSerials(request, 1);

  await page.goto("/registration");
  await expect(
    page.getByRole("heading", { name: "Create an account" }),
  ).toBeVisible();

  await page.locator("#username").fill("newuser");
  await page.locator('input[type="password"]').fill("password");
  await page.locator("#serial").fill(serial);
  await page.locator("#registerDescriptionCheckbox").check();
  await page.getByRole("button", { name: "Create account" }).click();

  // Registration auto-logs in and shows the finalize-registration email step
  await expect(page.locator("#email-notifications-enabled")).toBeVisible();
  await page.locator("#email-notifications-enabled").check();
  await page.locator("#email").fill("newuser@example.com");
  await page.locator("#registerDescriptionCheckbox").check();
  await page.getByRole("button", { name: "Save" }).click();

  // The user ends up logged in
  await page.getByTestId("navigation-icon").click();
  await expect(page.getByRole("link", { name: "Logout" })).toBeVisible();
});
