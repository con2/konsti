import { test, expect } from "@playwright/test";
import {
  populateDb,
  login,
  postTestSettings,
} from "playwright/playwrightUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { config } from "shared/config";

test("Add favorite", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, programItems: true });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);

  // Navigate to program list tab
  await programList.gotoAllProgram();

  // Favorite first program item
  await programList.waitForItems();
  const firstItem = programList.firstItem();

  const favoriteProgramItemTitle = await firstItem.title.textContent();

  await firstItem.favorite();

  // Go to My Program and check favorite program item title
  await programList.gotoMyProgram();

  const programItemTitle = await programList.favoriteList
    .getByTestId("program-item-title")
    .textContent();

  expect(programItemTitle?.trim()).toEqual(favoriteProgramItemTitle);
});
