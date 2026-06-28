import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  postSettings,
  postTestSettings,
  login,
  addProgramItems,
  clearDb,
  populateDb,
} from "playwright/playwrightUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { config } from "shared/config";
import { Tag } from "shared/types/models/programItem";
import { testProgramItem } from "shared/tests/testProgramItem";

test("Pre-convention week program item uses direct signup even with lottery program type", async ({
  page,
  request,
}) => {
  const startTime = dayjs(config.event().eventStartTime)
    .add(3, "hour")
    .startOf("hour")
    .toISOString();
  const endTime = dayjs(startTime)
    .add(testProgramItem.mins, "minutes")
    .toISOString();

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

  // Even with the lottery signup strategy enabled, pre-convention week items
  // should use direct signup
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

  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  const programItemTitle = await firstProgramItem.title.textContent();

  // Direct signup is offered, not lottery signup
  await expect(firstProgramItem.signUpButton).toBeVisible();
  await expect(firstProgramItem.lotterySignupButton).toHaveCount(0);
  await expect(firstProgramItem.container).toContainText("0/4 sign-ups");

  // Sign up directly and confirm the spot is taken immediately
  await firstProgramItem.signUp();
  await firstProgramItem.confirm();

  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");

  // The signup lands in the direct signup list, not the lottery signup list
  await programList.gotoMyProgram();

  const directSignupTitle = await programList.directSignupList
    .getByTestId("program-item-title")
    .textContent();
  expect(directSignupTitle?.trim()).toEqual(programItemTitle?.trim());

  await expect(
    programList.lotterySignupList.getByTestId("program-item-title"),
  ).toHaveCount(0);
});
