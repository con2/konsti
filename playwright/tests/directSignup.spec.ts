import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  postTestSettings,
  login,
  addProgramItems,
  clearDb,
  addUser,
} from "playwright/playwrightUtils";
import { config } from "shared/config";

test("Add and cancel direct signup", async ({ page, request }) => {
  await clearDb(request);
  await addUser(request);
  await addProgramItems(request, [
    {
      startTime: dayjs(config.event().eventStartTime)
        .add(1, "hour")
        .startOf("hour")
        .toISOString(),
    },
  ]);
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  // Navigate to program list tab and select RPG program type
  await page.click("data-testid=program-list-tab");
  await page
    .getByRole("combobox", {
      name: /program type/i,
    })
    .selectOption("Tabletop RPG");

  // Direct signup to first program item
  await page.waitForSelector("data-testid=program-item-container");
  const firstProgramItem = page.locator(
    "data-testid=program-item-container >> nth=0",
  );

  const directSignupProgramItemTitle = await firstProgramItem
    .locator("data-testid=program-item-title")
    .textContent();

  await expect(page.getByTestId("program-item-container")).toContainText(
    "0/4 sign-ups",
  );

  await firstProgramItem.getByRole("button", { name: /sign up/i }).click();
  await firstProgramItem.getByRole("button", { name: /confirm/i }).click();

  // Check attendee count is incremented
  await expect(page.getByTestId("program-item-container")).toContainText(
    "1/4 sign-ups",
  );
  await page.getByRole("button", { name: "Show players" }).click();
  await expect(
    page.getByTestId("program-item-container").getByRole("listitem"),
  ).toContainText("test1");

  // Go to My Program and check direct signup program item title
  await page.click("data-testid=my-program-tab");

  const directSignupProgramItems = page.locator(
    "data-testid=direct-signup-program-items-list",
  );

  const programItemTitle = await directSignupProgramItems
    .locator("data-testid=program-item-title")
    .textContent();

  expect(programItemTitle?.trim()).toEqual(directSignupProgramItemTitle);

  // Cancel direct signup on My Program page
  await page.getByRole("button", { name: "Cancel sign-up" }).click();
  await page.getByRole("button", { name: "Cancel your sign-up" }).click();
  await expect(
    page.getByTestId("direct-signup-program-items-list").getByRole("paragraph"),
  ).toContainText(
    "No sign-ups. You can sign up to program in the All Program view.",
  );

  // Navigate back to program list and sign again and cancel
  await page.getByTestId("program-list-tab").click();
  await expect(page.getByTestId("program-item-container")).toContainText(
    "0/4 sign-ups",
  );

  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByTestId("program-item-container")).toContainText(
    "1/4 sign-ups",
  );

  await page.getByRole("button", { name: "Cancel sign-up" }).click();
  await page.getByRole("button", { name: "Cancel your sign-up" }).click();
  await expect(page.getByTestId("program-item-container")).toContainText(
    "0/4 sign-ups",
  );
});
