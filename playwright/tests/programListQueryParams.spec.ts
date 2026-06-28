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
import { ProgramType } from "shared/types/models/programItem";

test("Active program type is selected from the programType query parameter", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programItemId: "rpg-item",
      title: "Aardvark Adventure",
      programType: ProgramType.TABLETOP_RPG,
      startTime: dayjs(config.event().eventStartTime)
        .add(1, "hour")
        .startOf("hour")
        .toISOString(),
    },
    {
      ...testProgramItem,
      programItemId: "larp-item",
      title: "Zebra Zone",
      programType: ProgramType.LARP,
      startTime: dayjs(config.event().eventStartTime)
        .add(2, "hour")
        .startOf("hour")
        .toISOString(),
    },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await login(page, request, { username: "test1", password: "test" });

  const programList = new ProgramListPage(page);
  const items = programList.items;

  // Without the query param both program items are listed
  await page.goto("/program/list");
  await expect(items).toHaveCount(2);

  // The query param selects Larp as the active program type
  await page.goto("/program/list?programType=larp");
  await expect(programList.programTypeSelect).toHaveValue(ProgramType.LARP);

  // The list now only shows items of the selected program type
  await expect(items).toHaveCount(1);
  await expect(items.getByTestId("program-item-title")).toContainText(
    "Zebra Zone",
  );
});

test("The invalid query parameter lists only program items missing required info", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programItemId: "valid-item",
      title: "Valid Program Item",
      minAttendance: 2,
      maxAttendance: 4,
      startTime: dayjs(config.event().eventStartTime)
        .add(1, "hour")
        .startOf("hour")
        .toISOString(),
    },
    {
      ...testProgramItem,
      programItemId: "invalid-item",
      title: "Invalid Program Item",
      // Missing max attendance makes a Konsti signup item invalid
      minAttendance: 2,
      maxAttendance: 0,
      startTime: dayjs(config.event().eventStartTime)
        .add(2, "hour")
        .startOf("hour")
        .toISOString(),
    },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await login(page, request, { username: "test1", password: "test" });

  const programList = new ProgramListPage(page);
  const items = programList.items;

  // Without the query param both the valid and invalid items are listed
  await page.goto("/program/list?programType=tabletoprpg");
  await expect(items).toHaveCount(2);

  // With the invalid query param only the item missing info is listed
  await page.goto("/program/list?programType=tabletoprpg&invalid");
  await expect(items).toHaveCount(1);
  await expect(items.getByTestId("program-item-title")).toContainText(
    "Invalid Program Item",
  );
});
