import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  populateDb,
  login,
  addProgramItems,
  postTestSettings,
} from "playwright/playwrightUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";

test("Opening a program item resets scroll, and returning restores the list position", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  // Enough items that the list is tall enough to scroll
  const startTime = dayjs(config.event().eventStartTime)
    .add(1, "hour")
    .startOf("hour")
    .toISOString();
  await addProgramItems(
    request,
    Array.from({ length: 40 }, (_, index) => ({
      ...testProgramItem,
      programItemId: `scroll-item-${index}`,
      title: `Scroll test item ${index}`,
      startTime,
    })),
  );
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");
  await programList.waitForItems();

  // Scroll the list down. Wait for the virtualizer to mount a card near the top
  // of the viewport at the new position (a programmatic scroll re-renders the
  // list asynchronously), then pick that item
  await page.evaluate(() => {
    window.scrollTo(0, 4000);
  });
  // Wait for the list to settle with a card mounted within the viewport (below
  // the sticky header area). The window spans the full viewport height so it
  // can't fall between two tall cards
  await page.waitForFunction(() =>
    Array.from(
      document.querySelectorAll('[data-testid="program-item-container"]'),
    ).some((card) => {
      const top = card.getBoundingClientRect().top;
      return top > 80 && top < window.innerHeight - 100;
    }),
  );

  const { scrollBefore, href } = await page.evaluate(() => {
    const visibleCards = Array.from(
      document.querySelectorAll('[data-testid="program-item-container"]'),
      (card) => ({ card, top: card.getBoundingClientRect().top }),
    )
      .filter((entry) => entry.top > 80 && entry.top < window.innerHeight - 100)
      .toSorted((a, b) => a.top - b.top);
    const link = visibleCards[0].card.querySelector(
      'a[href*="/program/item/"]',
    );
    return { scrollBefore: window.scrollY, href: link?.getAttribute("href") };
  });
  expect(href).toBeTruthy();
  expect(scrollBefore).toBeGreaterThan(1000);

  // Opening the item navigates to its page, which is scrolled to the top
  await page.locator(`a[href="${href}"]`).click();
  await page.waitForURL(/\/program\/item\//);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  // Going back restores the list position: the scroll returns down the list
  // (not reset to the top) and the opened item is rendered again near where it
  // was — it would not be mounted at all if the list had reset to the top
  await page.goBack();
  await page.waitForURL(/\/program\/list/);
  await expect(page.locator(`a[href="${href}"]`)).toBeAttached();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(1000);
});
