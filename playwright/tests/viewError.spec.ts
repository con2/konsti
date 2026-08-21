import { APIRequestContext, Page, expect, test } from "@playwright/test";
import { config } from "shared/config";
import { AboutPage } from "playwright/pages/AboutPage";
import { AdminPage } from "playwright/pages/AdminPage";
import {
  login,
  populateDb,
  postTestSettings,
} from "playwright/playwrightUtils";

// The admin view carries a button that throws while rendering, next to the
// Sentry test buttons. Those throw from a click handler instead, which an error
// boundary structurally cannot catch, so they cannot drive this
const triggerViewError = async (
  page: Page,
  request: APIRequestContext,
): Promise<AdminPage> => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await login(page, request, { username: "admin", password: "test" });

  await page.goto("/admin");

  const adminPage = new AdminPage(page);
  await adminPage.triggerViewError();
  return adminPage;
};

test("Show a recoverable error instead of a blank page when a view throws", async ({
  page,
  request,
}) => {
  const adminPage = await triggerViewError(page, request);

  // The view is replaced by the fallback rather than the page going blank
  await expect(adminPage.viewError).toBeVisible();
  await expect(adminPage.viewError).toContainText(/something went wrong/i);

  // The chrome outside the boundary survives, which is the point of wrapping
  // the routes rather than the whole app
  await expect(adminPage.navigation.icon).toBeVisible();
});

test("Navigating away from a thrown view recovers", async ({
  page,
  request,
}) => {
  const adminPage = await triggerViewError(page, request);
  await expect(adminPage.viewError).toBeVisible();

  // An error boundary holds its failed state until it is reset, so without
  // keying it on the route the fallback would survive this navigation and the
  // header links would appear to do nothing
  await adminPage.navigation.gotoProgram();

  await expect(adminPage.viewError).toBeHidden();
});

// A lazily loaded view fails differently from one that throws while rendering:
// React.lazy remembers the rejection, so re-rendering the same element throws it
// again without ever re-running the import
test("Retrying recovers a view whose chunk failed to load", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await login(page, request, { username: "test1", password: "test" });

  await page.route(
    (url) => {
      const file = url.pathname.split("/").pop() ?? "";
      // "AboutView." is the dev server's module request, "AboutView-" the
      // built chunk
      return file.startsWith("AboutView.") || file.startsWith("AboutView-");
    },
    async (route) => {
      await route.abort();
    },
  );

  // The tab that AboutView itself backs, rather than the section's index
  await page.goto("/about/about");

  const aboutPage = new AboutPage(page);
  await expect(aboutPage.viewError).toBeVisible();

  // Stop blocking, so the import has something to succeed at
  await page.unrouteAll();

  await aboutPage.main.getByRole("button", { name: /try again/i }).click();

  await expect(aboutPage.viewError).toBeHidden();
  await expect(aboutPage.heading("What is Konsti?")).toBeVisible();
});
