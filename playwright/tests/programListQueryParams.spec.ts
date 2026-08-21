import { expect, test } from "@playwright/test";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  hoursIntoEvent,
  login,
  populateDb,
  postTestSettings,
} from "playwright/playwrightUtils";

// The query param can only select a program type the event has
const [firstProgramType, secondProgramType] = config.event().activeProgramTypes;

test.skip(
  !secondProgramType,
  "Event has a single program type, so there is nothing to narrow the list to",
);

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
      programType: firstProgramType,
      startTime: hoursIntoEvent(1),
    },
    {
      ...testProgramItem,
      programItemId: "larp-item",
      title: "Zebra Zone",
      programType: secondProgramType,
      startTime: hoursIntoEvent(2),
    },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await login(page, request, { username: "test1", password: "test" });

  const programList = new ProgramListPage(page);
  const items = programList.items;

  // Without the query param both program items are listed
  await page.goto("/program/list");
  await expect(items).toHaveCount(2);

  // The query param selects the second program type as the active one
  await page.goto(
    `/program/list?programType=${secondProgramType.toLowerCase()}`,
  );
  await expect(programList.programTypeFilter).not.toContainText(
    "All program types",
  );

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
      startTime: hoursIntoEvent(1),
    },
    {
      ...testProgramItem,
      programItemId: "invalid-item",
      title: "Invalid Program Item",
      // Missing max attendance makes a Konsti sign-up item invalid
      minAttendance: 2,
      maxAttendance: 0,
      startTime: hoursIntoEvent(2),
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
