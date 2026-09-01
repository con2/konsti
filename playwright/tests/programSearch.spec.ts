import { expect, test } from "@playwright/test";
import { testProgramItem } from "shared/tests/testProgramItem";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  hoursIntoEvent,
  login,
  populateDb,
  postTestSettings,
  signupsOpenTime,
} from "playwright/playwrightUtils";

test("Search filters the program list and shows the empty state", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programItemId: "search-item-1",
      title: "Aardvark Adventure",
      startTime: hoursIntoEvent(1),
    },
    {
      ...testProgramItem,
      programItemId: "search-item-2",
      title: "Zebra Zone",
      startTime: hoursIntoEvent(2),
    },
  ]);
  await postTestSettings(request, { testTime: signupsOpenTime() });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);

  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");

  const items = programList.items;
  await expect(items).toHaveCount(2);

  // Search by title narrows the list to a single item
  await programList.search("Aardvark");
  await expect(items).toHaveCount(1);
  await expect(items.getByTestId("program-item-title")).toContainText(
    "Aardvark Adventure",
  );

  // A non-matching search shows the empty state
  await programList.search("nonexistent-zzz");
  await expect(items).toHaveCount(0);
  await expect(programList.main).toContainText(
    "found, please check your search conditions",
  );
});

test("The empty state is not shown while the program list loads its items", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programItemId: "load-item-1",
      title: "Aardvark Adventure",
      startTime: hoursIntoEvent(1),
    },
  ]);
  await postTestSettings(request, { testTime: signupsOpenTime() });
  await login(page, request, { username: "test1", password: "test" });

  // The list renders at a lower priority (useDeferredValue), so its initial
  // value is momentarily empty. Record whether the "no program items" empty
  // state is ever inserted into the DOM during that transition — it must not be,
  // since there are matching items to show. Installed before the app renders,
  // and inspects added nodes so a single-commit flash is still caught.
  await page.addInitScript(() => {
    const state = globalThis as unknown as { emptyStateAppeared?: boolean };
    state.emptyStateAppeared = false;
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (
            node.textContent?.includes("please check your search conditions")
          ) {
            state.emptyStateAppeared = true;
          }
        }
      }
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
    });
  });

  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();

  const emptyStateAppeared = await page.evaluate(
    () =>
      (globalThis as unknown as { emptyStateAppeared?: boolean })
        .emptyStateAppeared,
  );
  expect(emptyStateAppeared).toBe(false);
});
