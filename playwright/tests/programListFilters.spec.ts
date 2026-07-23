import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  populateDb,
  login,
  addProgramItems,
  postTestSettings,
  testPostDirectSignup,
} from "playwright/playwrightUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { ProgramType } from "shared/types/models/programItem";

test("Program list filters narrow the list and persist over reload", async ({
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
      programItemId: "open-item",
      title: "Open program item",
      revolvingDoor: false,
      startTime,
    },
    {
      ...testProgramItem,
      programItemId: "full-item",
      title: "Full program item",
      revolvingDoor: false,
      minAttendance: 1,
      maxAttendance: 1,
      startTime,
    },
    {
      ...testProgramItem,
      programItemId: "revolving-door-item",
      title: "Revolving door program item",
      startTime,
    },
    {
      ...testProgramItem,
      programItemId: "larp-item",
      title: "Larp program item",
      programType: ProgramType.LARP,
      revolvingDoor: false,
      startTime,
    },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });

  // Fill the one-seat program item so it shows as fully booked
  await testPostDirectSignup(request, "test2", {
    directSignupProgramItemId: "full-item",
    message: "",
  });

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();

  // An empty program type selection shows all program types
  const items = programList.items;
  await expect(items).toHaveCount(4);

  // Selecting a program type drops the other types from the list
  await programList.selectProgramType("Tabletop RPG");
  await expect(items).toHaveCount(3);
  await expect(
    programList.itemByTitle("Full program item").container,
  ).toContainText("1/1 sign-ups");

  // Hiding full items drops the fully booked item from the list
  await programList.toggleHideFullItems();
  await expect(items).toHaveCount(2);
  await expect(
    programList.itemByTitle("Full program item").container,
  ).toHaveCount(0);

  // The search filters within the other active filters
  await programList.search("Revolving");
  await expect(items).toHaveCount(1);
  await expect(items.getByTestId("program-item-title")).toContainText(
    "Revolving door program item",
  );

  // The revolving door view shows only revolving door items
  await programList.selectStartingTime("Revolving door");
  await expect(items).toHaveCount(1);

  // The info panel is shown; no revolving door item is running yet
  await expect(programList.main).toContainText("You can join a revolving door");
  await expect(programList.main).toContainText("No running revolving door");

  // All filter selections persist over a reload
  await page.reload();
  await expect(programList.programTypeFilter).toContainText("Tabletop RPG");
  await expect(programList.hideFullItemsCheckbox).toBeChecked();
  await expect(programList.startingTimeOption("Revolving door")).toBeChecked();
  await expect(programList.searchInput).toHaveValue("Revolving");
  await expect(items).toHaveCount(1);

  // Reverting the filters shows the program type selection still applies:
  // the larp is not shown
  await programList.search("");
  await programList.selectStartingTime("Upcoming");
  await programList.toggleHideFullItems();
  await expect(items).toHaveCount(3);
});
