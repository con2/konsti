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
