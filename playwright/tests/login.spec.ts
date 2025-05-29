import { test, expect } from "@playwright/test";
import { populateDb } from "playwright/playwrightUtils";

test("Admin login", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, programItems: true });

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
  await populateDb(request, { clean: true, users: true, programItems: true });

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

test("Login redirect back to program item", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, programItems: true });

  const username = "test1";
  const password = "test";

  await page.goto("/");

  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  const fistProgramItemTitle =
    firstProgramItem.getByTestId("program-item-title");

  await fistProgramItemTitle.click();
  await page.waitForURL("/program/item/*");

  await page.getByRole("link", { name: "Log in to sign up" }).click();
  await page.fill("data-testid=login-form-input-username", username);
  await page.fill("data-testid=login-form-input-password", password);
  await page.click("data-testid=login-button");

  const programItemTitle = await page
    .getByTestId("program-item-title")
    .getByRole("link")
    .textContent();

  expect(programItemTitle).toEqual(await fistProgramItemTitle.textContent());
});
