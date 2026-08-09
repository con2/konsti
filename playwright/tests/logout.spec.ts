import { test, expect } from "@playwright/test";
import { populateDb, login } from "playwright/playwrightUtils";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
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

test("A rejected session is given up on rather than retried every poll", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });

  let recoveryAttempts = 0;
  page.on("request", (pageRequest) => {
    if (
      pageRequest.method() === "POST" &&
      pageRequest.url().includes(ApiEndpoint.SESSION_RESTORE)
    ) {
      recoveryAttempts += 1;
    }
  });

  // Well formed and decodable, but signed with a key this server doesn't
  // know, which is what a deploy that rotates the secret leaves in an open tab
  const foreignJwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3QxIiwidXNlckdyb3VwIjoidXNlciJ9.not-a-valid-signature";
  await page.addInitScript(
    ({ stateKey, jwt }) => {
      localStorage.setItem(stateKey, JSON.stringify({ login: { jwt } }));
    },
    { stateKey: localStorageStateKey, jwt: foreignJwt },
  );

  // Mocked before load so the data poll can be fast-forwarded instead of waited for
  await page.clock.install();
  await page.goto("/");

  const navigation = new Navigation(page);
  await navigation.open();
  await expect(navigation.loginLink).toBeVisible();

  // The rejected token is dropped from storage and from the running app, so
  // the poll that follows has nothing left to recover
  expect(
    await page.evaluate(
      (stateKey) => localStorage.getItem(stateKey),
      localStorageStateKey,
    ),
  ).toBeNull();

  await page.clock.fastForward("01:01");
  await page.clock.fastForward("01:01");
  expect(recoveryAttempts).toBe(1);
});
