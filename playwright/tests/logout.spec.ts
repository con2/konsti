import { test, expect } from "@playwright/test";
import { populateDb, login } from "playwright/playwrightUtils";
import { Navigation } from "playwright/pages/Navigation";
import { localStorageStateKey } from "shared/constants/browserStorage";

test("Logout clears the session", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const navigation = new Navigation(page);

  // Sanity check: logged in (Logout link present in navigation)
  await navigation.logout();

  // Session storage is cleared on logout
  expect(
    await page.evaluate(
      (stateKey) => localStorage.getItem(stateKey),
      localStorageStateKey,
    ),
  ).toBeNull();

  // Logged-out navigation offers a login link
  await navigation.open();
  await expect(navigation.loginLink).toBeVisible();
});

test("Invalid persisted session is cleared and the app boots logged out", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true });

  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  // A session that fails the strict schema parse, as a mid-event shape change would
  await page.addInitScript((stateKey) => {
    localStorage.setItem(stateKey, JSON.stringify({ unexpected: true }));
  }, localStorageStateKey);

  await page.goto("/");

  // The app boots into a clean logged-out state instead of crashing or hanging
  const navigation = new Navigation(page);
  await navigation.open();
  await expect(navigation.loginLink).toBeVisible();

  // The invalid value was removed so the failure doesn't repeat on every load
  expect(
    await page.evaluate(
      (stateKey) => localStorage.getItem(stateKey),
      localStorageStateKey,
    ),
  ).toBeNull();

  // The console error doubles as proof that the telemetry branch ran (the
  // Sentry capture next to it is a no-op outside production/staging)
  expect(
    consoleErrors.some((text) => text.includes("Invalid localStorage session")),
  ).toBe(true);
});
