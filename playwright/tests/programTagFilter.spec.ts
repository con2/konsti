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
import { AgeGroup, Language, Tag } from "shared/types/models/programItem";

test("Multiple tag filters combine with AND logic and persist over reload", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  const startTime = dayjs(config.event().eventStartTime)
    .add(1, "hour")
    .startOf("hour")
    .toISOString();
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programItemId: "tag-filter-item-1",
      title: "Family Friendly Finnish",
      tags: [Tag.BEGINNER_FRIENDLY],
      ageGroups: [AgeGroup.FAMILIES],
      languages: [Language.FINNISH],
      startTime,
    },
    {
      ...testProgramItem,
      programItemId: "tag-filter-item-2",
      title: "Beginner Bonanza",
      tags: [Tag.BEGINNER_FRIENDLY],
      ageGroups: [],
      languages: [Language.FINNISH],
      startTime,
    },
    {
      ...testProgramItem,
      programItemId: "tag-filter-item-3",
      title: "Plain Program",
      tags: [],
      ageGroups: [],
      languages: [Language.FINNISH],
      startTime,
    },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);

  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");

  const items = programList.items;
  await expect(items).toHaveCount(3);

  // Selecting one tag narrows the list to matching items
  await programList.openTagFilter();
  await programList.toggleTag("Beginner-friendly");
  await expect(items).toHaveCount(2);

  // Selecting a second tag narrows further: only items matching ALL selected
  // tags are shown
  await programList.toggleTag("Directed at families");
  await expect(items).toHaveCount(1);
  await expect(items.getByTestId("program-item-title")).toContainText(
    "Family Friendly Finnish",
  );

  // The control shows the selected tags as pills
  await expect(programList.tagFilter).toContainText("Beginner-friendly");
  await expect(programList.tagFilter).toContainText("Directed at families");

  // The selection persists over a reload via sessionStorage
  await page.reload();
  await expect(items).toHaveCount(1);

  // A pill's remove button drops that one tag from the filter
  await programList.removeTag("Directed at families");
  await expect(items).toHaveCount(2);

  // Clearing the selection shows all items again
  await programList.openTagFilter();
  await programList.clearTagFilter();
  await expect(items).toHaveCount(3);
});
