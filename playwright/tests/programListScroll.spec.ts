import { Page, APIRequestContext, test, expect } from "@playwright/test";
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

// Seed enough program items that the list is tall enough to scroll, and open
// the All Program list
const openSeededProgramList = async (
  page: Page,
  request: APIRequestContext,
): Promise<ProgramListPage> => {
  await populateDb(request, { clean: true, users: true, admin: true });
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
  return programList;
};

// Scroll the list down and wait for the position to settle: measuring the
// newly rendered rows makes the virtualizer adjust the offset once (the real
// row sizes replace the estimates). Returns the settled scroll offset
const scrollDownAndSettle = async (page: Page): Promise<number> => {
  await page.evaluate(() => {
    window.scrollTo(0, 4000);
  });
  let settledScroll = -1;
  await expect
    .poll(async () => {
      const current = await page.evaluate(() => window.scrollY);
      const settled = current === settledScroll;
      settledScroll = current;
      return settled;
    })
    .toBe(true);
  expect(settledScroll).toBeGreaterThan(1000);
  return settledScroll;
};

test("Opening a program item resets scroll, and returning restores the list position", async ({
  page,
  request,
}) => {
  await openSeededProgramList(page, request);

  // Wait for the list to settle with a card mounted within the viewport (below
  // the sticky header area). The window spans the full viewport height so it
  // can't fall between two tall cards
  const scrollBefore = await scrollDownAndSettle(page);
  await page.waitForFunction(() =>
    Array.from(
      document.querySelectorAll('[data-testid="program-item-container"]'),
    ).some((card) => {
      const top = card.getBoundingClientRect().top;
      return top > 80 && top < window.innerHeight - 100;
    }),
  );

  // Pick the bottom-most fully visible card — the one that falls below the
  // fold if the restored position is off by even a partial row
  const { href, cardTopBefore } = await page.evaluate(() => {
    const visibleCards = Array.from(
      document.querySelectorAll('[data-testid="program-item-container"]'),
      (card) => ({ card, top: card.getBoundingClientRect().top }),
    )
      .filter((entry) => entry.top > 80 && entry.top < window.innerHeight - 100)
      .toSorted((a, b) => a.top - b.top);
    const chosen = visibleCards.at(-1);
    const link = chosen?.card.querySelector('a[href*="/program/item/"]');
    return { href: link?.getAttribute("href"), cardTopBefore: chosen?.top };
  });
  expect(href).toBeTruthy();
  expect(cardTopBefore).toBeTruthy();

  // Opening the item navigates to its page, which is scrolled to the top.
  // Navigate with a dispatched click: a regular click() first scrolls and
  // focuses the target (WebKit shifts the page by several hundred px doing
  // this), which would move the offset this test asserts is restored
  await page.locator(`a[href="${href}"]`).dispatchEvent("click");
  await page.waitForURL(/\/program\/item\//);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  // Going back restores the exact list position (the saved offset plus the
  // measured row sizes are restored), so the opened item is rendered again in
  // the same place it was clicked
  await page.goBack();
  await page.waitForURL(/\/program\/list/);
  await expect(page.locator(`a[href="${href}"]`)).toBeAttached();
  await expect
    .poll(async () => {
      const scrollAfter = await page.evaluate(() => window.scrollY);
      return Math.abs(scrollAfter - scrollBefore);
    })
    .toBeLessThanOrEqual(2);
  // The clicked card itself is back on screen in the same place
  await expect
    .poll(async () => {
      const cardTopAfter = await page
        .locator(`a[href="${href}"]`)
        .evaluate(
          (link) =>
            link
              .closest('[data-testid="program-item-container"]')
              ?.getBoundingClientRect().top,
        );
      return Math.abs((cardTopAfter ?? Infinity) - (cardTopBefore ?? 0));
    })
    .toBeLessThanOrEqual(2);
});

test("Scroll to top button scrolls the virtualized list back to the top", async ({
  page,
  request,
}) => {
  const programList = await openSeededProgramList(page, request);
  await scrollDownAndSettle(page);

  // One click must land all the way at the top: the scroll goes through the
  // virtualizer, whose smooth scroll re-targets until the offset is stable —
  // a plain window smooth scroll would be cancelled partway when the rows
  // mounting above the viewport get measured
  await programList.scrollToTopButton.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  // The virtualizer re-rendered the top of the list (the first card may still
  // sit below the fold on small viewports — the filter card takes the screen)
  await expect(
    page.getByRole("heading", { name: "Scroll test item 0" }),
  ).toBeAttached();

  // The position also stays at the top: measuring the rows that mounted
  // during the jump must not nudge the scroll back down afterwards
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
