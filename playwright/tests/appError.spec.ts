import { Page, expect, test } from "@playwright/test";
import { ProgramListPage } from "playwright/pages/ProgramListPage";

// The app is loaded lazily, and a failed chunk is retried once by reloading the
// page before the error is allowed to surface. Blocking the chunk on every
// request drives both halves: the reload, and the throw that follows it.
//
// The handler stays registered and is switched off through the returned
// callback rather than by unrouting: removing a route has to win a race against
// the reload the page triggers itself, which on WebKit is where competing
// navigations interrupt each other
const blockAppChunk = async (page: Page): Promise<() => void> => {
  let blocked = true;

  await page.route(
    (url) => {
      const file = url.pathname.split("/").pop() ?? "";
      // "App." is the dev server's module request, "App-" the built chunk.
      // Neither matches AppRoutes or AppUpdateBanner
      return file.startsWith("App.") || file.startsWith("App-");
    },
    async (route) => {
      if (blocked) {
        await route.abort();
        return;
      }
      await route.fallback();
    },
  );

  return () => {
    blocked = false;
  };
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
  const stopBlocking = await blockAppChunk(page);
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await expect(programList.appError).toBeVisible();

  // Let the chunk through, so the reload the button triggers can succeed
  stopBlocking();

  // The lazy import runs again on the next load, so the button is a real retry
  await programList.main.getByRole("button", { name: /reload/i }).click();

  // The positive signal first, and with room to spare: the app boots from
  // scratch after the reload, which the WebKit container runs slowly. Asserting
  // the fallback is gone would otherwise pass while the page is still blank
  await expect(programList.navigation.icon).toBeVisible({ timeout: 20_000 });
  await expect(programList.appError).toBeHidden();
});
