import { test, expect } from "@playwright/test";
import { addUser, clearDb, login } from "playwright/playwrightUtils";

test("About page views content logged", async ({ page, request }) => {
  await clearDb(request);
  await addUser(request);
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  await page.getByRole("link", { name: "About Konsti" }).click();
  await expect(page.locator("h2")).toContainText("Konsti Help");

  await page.getByRole("link", { name: "FAQ" }).click();
  await expect(page.locator("h2").first()).toContainText("For participants");

  await page.getByRole("link", { name: "About", exact: true }).click();
  await expect(page.locator("h2")).toContainText("What is Konsti?");
});

test("About page views content not logged", async ({ page, request }) => {
  await clearDb(request);

  await page.goto("/");

  await page.getByRole("link", { name: "About Konsti" }).click();
  await expect(page.locator("h2")).toContainText("Konsti Help");

  await page.getByRole("link", { name: "FAQ" }).click();
  await expect(page.locator("h2").first()).toContainText("For participants");

  await page.getByRole("link", { name: "About", exact: true }).click();
  await expect(page.locator("h2")).toContainText("What is Konsti?");
});
