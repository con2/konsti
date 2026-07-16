import { test, expect } from "@playwright/test";
import {
  populateDb,
  login,
  postTestSettings,
} from "playwright/playwrightUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { config } from "shared/config";

test("Add favorite", async ({ page, request }) => {
  // postTestSettings logs in as admin, so the admin user must exist
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
    programItems: true,
  });
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

// Touch devices emulate :hover on tap and keep it active after the tap, so the
// hover highlight must only apply on hover-capable devices — otherwise tapping
// the favorite button leaves a stuck highlight around it. Mobile emulation
// matches (hover: none) but a synthetic mouse hover still sets the :hover
// state, which is exactly the condition a real tap leaves behind.
test("Favorite button highlights on hover only on hover-capable devices", async ({
  page,
  request,
  isMobile,
}) => {
  // postTestSettings logs in as admin, so the admin user must exist
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
    programItems: true,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();

  const favoriteButton = programList.firstItem().addFavoriteButton;
  const getBackground = async (): Promise<string> =>
    favoriteButton.evaluate((el) => getComputedStyle(el).backgroundColor);

  const initialBackground = await getBackground();
  await favoriteButton.hover();
  const hoveredBackground = await getBackground();

  if (isMobile) {
    expect(hoveredBackground).toEqual(initialBackground);
  } else {
    expect(hoveredBackground).not.toEqual(initialBackground);
  }
});
