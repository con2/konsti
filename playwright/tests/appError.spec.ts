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
        // A failed response rather than an aborted request: WebKit caches the
        // abort and then never re-requests the chunk, so unblocking it below
        // would have nothing to act on. no-store keeps this one out of the
        // cache too
        await route.fulfill({
          status: 503,
          headers: { "cache-control": "no-store" },
          body: "",
        });
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

test("The app recovers once its chunk loads again", async ({
  page,
  browserName,
}) => {
  // WebKit keeps the failed module in its map and does not re-request the chunk
  // on the next load, whatever cache headers the failure carried - traces of the
  // failures show one request against three page loads. That makes the recovery
  // unobservable there rather than broken, so the assertion runs on Chromium,
  // and the fallback itself is covered on every browser by the test above
  test.skip(
    browserName === "webkit",
    "WebKit does not re-request a module that already failed",
  );

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
