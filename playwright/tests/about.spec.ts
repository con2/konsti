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

test("Switch language between English and Finnish", async ({
  page,
  request,
}) => {
  await clearDb(request);

  await page.goto("/");

  const aboutPage = new AboutPage(page);
  const languageSelector = page.locator("#language");

  await aboutPage.gotoHelp();
  await aboutPage.gotoFaq();
  await expect(aboutPage.heading("For participants")).toBeVisible();

  // Switch to Finnish: the FAQ content and its embedded components render in Finnish
  await languageSelector.selectOption("fi");
  await expect(aboutPage.heading("Osallistujille")).toBeVisible();

  // Expand the help question: the desk names come from the HelpDesks component
  await page.getByRole("button", { name: /Mistä saan apua/ }).click();
  await expect(aboutPage.main).toContainText("Larp- ja Roolipelitiski");

  // And back to English
  await languageSelector.selectOption("en");
  await expect(aboutPage.heading("For participants")).toBeVisible();
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
