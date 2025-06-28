import { test, expect } from "@playwright/test";
import { addUser, clearDb, login } from "playwright/playwrightUtils";

test("About page views content logged", async ({ page, request }) => {
  await clearDb(request);
  await addUser(request);
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  await page.getByRole("link", { name: "About Konsti" }).click();
  const helpHeading = page.locator("h2", { hasText: "Konsti Help" });
  await expect(helpHeading).toBeVisible();

  await page.getByRole("link", { name: "FAQ" }).click();
  const faqHeading = page.locator("h2", { hasText: "For participants" });
  await expect(faqHeading).toBeVisible();

  await page.getByRole("link", { name: "About", exact: true }).click();
  const aboutHeading = page.locator("h2", { hasText: "What is Konsti?" });
  await expect(aboutHeading).toBeVisible();
});

test("About page views content not logged", async ({ page, request }) => {
  await clearDb(request);

  await page.goto("/");

  await page.getByRole("link", { name: "About Konsti" }).click();
  const helpHeading = page.locator("h2", { hasText: "Konsti Help" });
  await expect(helpHeading).toBeVisible();

  await page.getByRole("link", { name: "FAQ" }).click();
  const faqHeading = page.locator("h2", { hasText: "For participants" });
  await expect(faqHeading).toBeVisible();

  await page.getByRole("link", { name: "About", exact: true }).click();
  const aboutHeading = page.locator("h2", { hasText: "What is Konsti?" });
  await expect(aboutHeading).toBeVisible();
});
