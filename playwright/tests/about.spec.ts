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

  // Expand the help question: its answer names the help desks only for events
  // that have them, so assert the part that is there either way
  await page.getByRole("button", { name: /Mistä saan apua/ }).click();
  await expect(aboutPage.main).toContainText(
    "Vapaaehtoisemme auttavat Konstin käytössä ja ohjelmanumeroihin ilmoittautumisessa",
  );

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
