import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  populateDb,
  login,
  addProgramItems,
  postTestSettings,
} from "playwright/playwrightUtils";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";

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
      startTime: dayjs(config.event().eventStartTime)
        .add(1, "hour")
        .startOf("hour")
        .toISOString(),
    },
    {
      ...testProgramItem,
      programItemId: "search-item-2",
      title: "Zebra Zone",
      startTime: dayjs(config.event().eventStartTime)
        .add(2, "hour")
        .startOf("hour")
        .toISOString(),
    },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  await page.click("data-testid=program-list-tab");
  await page
    .getByRole("combobox", { name: /program type/i })
    .selectOption("Tabletop RPG");

  const items = page.locator('[data-testid="program-item-container"]');
  await expect(items).toHaveCount(2);

  // Search by title narrows the list to a single item
  await page.locator("#find").fill("Aardvark");
  await expect(items).toHaveCount(1);
  await expect(items.getByTestId("program-item-title")).toContainText(
    "Aardvark Adventure",
  );

  // A non-matching search shows the empty state
  await page.locator("#find").fill("nonexistent-zzz");
  await expect(items).toHaveCount(0);
  await expect(page.locator("#main")).toContainText(
    "found, please check your search conditions",
  );
});
