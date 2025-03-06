import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  logTestStart,
  postTestSettings,
  login,
  addProgramItems,
  postUser,
  addSerials,
  clearDb,
} from "playwright/utils";
import { PostUserRequest } from "shared/types/api/users";

const testUser: PostUserRequest = {
  username: "test1",
  password: "test",
};

test("Add direct signup", async ({ page, request }) => {
  logTestStart("Add direct signup");
  await clearDb(request);
  const serials = await addSerials(request, 1);
  await postUser(request, { ...testUser, serial: serials[0] });
  await addProgramItems(request, [
    { startTime: dayjs().add(1, "hour").startOf("hour").toISOString() },
  ]);
  await postTestSettings(request, {
    testTime: dayjs().toISOString(),
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

  await firstProgramItem.getByRole("button", { name: /sign up/i }).click();
  await firstProgramItem.getByRole("button", { name: /confirm/i }).click();

  // Go to My Program and check direct signup program item title
  await page.click("data-testid=my-program-tab");

  const directSignupProgramItems = page.locator(
    "data-testid=direct-signup-program-items-list",
  );

  const programItemTitle = await directSignupProgramItems
    .locator("data-testid=program-item-title")
    .textContent();

  expect(programItemTitle?.trim()).toEqual(directSignupProgramItemTitle);
});
