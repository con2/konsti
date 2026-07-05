import { test, expect } from "@playwright/test";
import {
  login,
  addProgramItems,
  clearDb,
  populateDb,
  postTestSettings,
} from "playwright/playwrightUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";

const programType = config.event().twoPhaseSignupProgramTypes[0];
const initialProgramItem = {
  ...testProgramItem,
  title: "Initial program",
  programType,
  startTime: "2026-07-24T15:00:00.000Z",
  endTime: "2026-07-24T19:00:00.000Z",
};
const addedProgramItem = {
  ...testProgramItem2,
  title: "Added program",
  programType,
  startTime: "2026-07-24T15:00:00.000Z",
  endTime: "2026-07-24T19:00:00.000Z",
};

test("Periodic data poll picks up new program items without navigation", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [initialProgramItem]);
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  // Mock browser timers so the data poll (dataUpdateInterval, 60 s) can be
  // fast-forwarded instead of waited for. Must be installed before the app loads
  await page.clock.install();
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await expect(
    programList.itemByTitle("Initial program").container,
  ).toHaveCount(1);

  // A program item added server-side is not shown yet...
  // saveProgramItems treats the posted list as the full program, so include both
  await addProgramItems(request, [initialProgramItem, addedProgramItem]);
  await expect(programList.itemByTitle("Added program").container).toHaveCount(
    0,
  );

  // ...until the periodic poll fires and refetches the data
  await page.clock.fastForward("01:01");
  await expect(programList.itemByTitle("Added program").container).toHaveCount(
    1,
  );
});
