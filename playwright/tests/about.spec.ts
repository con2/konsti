import { test, expect } from "@playwright/test";
import { clearDb, login, populateDb } from "playwright/playwrightUtils";
import { AboutPage } from "playwright/pages/AboutPage";

test("About page views content logged", async ({ page, request }) => {
  await clearDb(request);
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const aboutPage = new AboutPage(page);

  await aboutPage.gotoHelp();
  await expect(aboutPage.heading("Konsti Help")).toBeVisible();

  await aboutPage.gotoFaq();
  await expect(aboutPage.heading("For participants")).toBeVisible();

  await aboutPage.gotoAbout();
  await expect(aboutPage.heading("What is Konsti?")).toBeVisible();
});

test("About page views content not logged", async ({ page, request }) => {
  await clearDb(request);

  await page.goto("/");

  const aboutPage = new AboutPage(page);

  await aboutPage.gotoHelp();
  await expect(aboutPage.heading("Konsti Help")).toBeVisible();

  await aboutPage.gotoFaq();
  await expect(aboutPage.heading("For participants")).toBeVisible();

  await aboutPage.gotoAbout();
  await expect(aboutPage.heading("What is Konsti?")).toBeVisible();
});
