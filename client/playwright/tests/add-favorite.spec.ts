import { test, expect } from "@playwright/test";
import { logTestStart, populateDb } from "./utils";

test("Add favorite", async ({ page, context, request }) => {
  logTestStart("Add favorite");
  await populateDb(request);

  const username = "test1";
  const password = "test";

  await page.goto("/");

  // Go to login page and enter login credentials
  await page.click("data-testid=navigation-icon");
  await page.click("data-testid=login-page-link");

  await page.fill("data-testid=login-form-input-username", username);
  await page.fill("data-testid=login-form-input-password", password);

  await page.click("data-testid=login-button");

  // Favorite first game
  await page.waitForSelector("data-testid=game-container");
  const firstGame = await page.locator("data-testid=game-container >> nth=0");

  const favoritedGameTitle = await firstGame
    .locator("data-testid=game-title")
    .innerText();

  await firstGame.locator("data-testid=add-favorite-button").click();

  // Go to My Games and check favorited game title
  await page.click("data-testid=navigation-icon");
  await page.click("data-testid=my-games-page-link");

  const favoritedGames = await page.locator("data-testid=favorited-games-list");

  const myGamesGameTitle = await favoritedGames
    .locator("data-testid=game-title")
    .innerText();

  expect(myGamesGameTitle.trim()).toEqual(favoritedGameTitle);
});
