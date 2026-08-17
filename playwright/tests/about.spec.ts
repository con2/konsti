import { expect, test } from "@playwright/test";
import { AboutPage } from "playwright/pages/AboutPage";
import { clearDb, login, populateDb } from "playwright/playwrightUtils";

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
  // and are per-event, so match the Finnish word for a desk rather than a name
  await page.getByRole("button", { name: /Mistä saan apua/ }).click();
  await expect(
    aboutPage.main
      .getByRole("listitem")
      .filter({ hasText: /tiski$/ })
      .first(),
  ).toBeVisible();

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
