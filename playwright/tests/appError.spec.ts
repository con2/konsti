import { Page, expect, test } from "@playwright/test";
import { ProgramListPage } from "playwright/pages/ProgramListPage";

// The app is loaded lazily, and a failed chunk is retried once by reloading the
// page before the error is allowed to surface. Blocking the chunk on every
// request drives both halves: the reload, and the throw that follows it
const blockAppChunk = async (page: Page): Promise<void> => {
  await page.route(
    (url) => {
      const file = url.pathname.split("/").pop() ?? "";
      // "App." is the dev server's module request, "App-" the built chunk.
      // Neither matches AppRoutes or AppUpdateBanner
      return file.startsWith("App.") || file.startsWith("App-");
    },
    async (route) => {
      await route.abort();
    },
  );
};

test("Show an error instead of a blank page when the app fails to load", async ({
  page,
}) => {
  await blockAppChunk(page);

  await page.goto("/");

  const programList = new ProgramListPage(page);

  // The boundary around the routes lives inside the app, so it cannot catch
  // this: without one above the app, React unmounts and leaves an empty page
  await expect(programList.appError).toBeVisible();
  await expect(programList.appError).toContainText(/could not be loaded/i);
});

test("The app recovers once its chunk loads again", async ({ page }) => {
  await blockAppChunk(page);
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await expect(programList.appError).toBeVisible();

  // Stop blocking, so the reload the button triggers can succeed
  await page.unrouteAll();

  // The lazy import runs again on the next load, so the button is a real retry
  await programList.main.getByRole("button", { name: /reload/i }).click();

  await expect(programList.appError).toBeHidden();
  await expect(programList.navigation.icon).toBeVisible();
});
