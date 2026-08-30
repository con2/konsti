import { expect, test } from "@playwright/test";
import { addMinutes } from "date-fns";
import { config } from "shared/config";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { testProgramItem } from "shared/tests/testProgramItem";
import { Tag } from "shared/types/models/programItem";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  clearDb,
  hoursIntoEvent,
  login,
  populateDb,
  postSettings,
  postTestSettings,
} from "playwright/playwrightUtils";

test.skip(
  !config.event().preConventionWeekSignupStartTime,
  "Event has no pre-convention week program",
);

test("Pre-convention week program item uses direct sign-up even with lottery program type", async ({
  page,
  request,
}) => {
  const startTime = hoursIntoEvent(3);
  const endTime = addMinutes(
    new Date(startTime),
    testProgramItem.mins,
  ).toISOString();

  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      // Lottery program type with the pre-convention week tag
      programType: config.event().twoPhaseSignupProgramTypes[0],
      tags: [Tag.PRE_CONVENTION_WEEK],
      startTime,
      endTime,
    },
  ]);

  // Even with the lottery sign-up strategy enabled, pre-convention week items
  // should use direct sign-up
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);

  // Navigate to program list tab and select RPG program type
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");
  // Pre-convention week program is not in the upcoming list during the main event
  await programList.selectStartingTime("All");

  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  const programItemTitle = await firstProgramItem.title.textContent();

  // Direct sign-up is offered, not lottery sign-up
  await expect(firstProgramItem.signUpButton).toBeVisible();
  await expect(firstProgramItem.lotterySignupButton).toHaveCount(0);
  await expect(firstProgramItem.container).toContainText("0/4 sign-ups");

  // Sign up directly and confirm the spot is taken immediately
  await firstProgramItem.signUp();
  await firstProgramItem.confirm();

  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");

  // The sign-up lands in the direct sign-up list, not the lottery sign-up list
  await programList.gotoMyProgram();

  const directSignupTitle = await programList.directSignupList
    .getByTestId("program-item-title")
    .textContent();
  expect(directSignupTitle?.trim()).toEqual(programItemTitle?.trim());

  await expect(
    programList.lotterySignupList.getByTestId("program-item-title"),
  ).toHaveCount(0);
});
