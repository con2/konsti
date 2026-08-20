import { expect, test } from "@playwright/test";
import { addHours, addMinutes, startOfHour } from "date-fns";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { SignupType } from "shared/types/models/programItem";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  login,
  populateDb,
  postTestSettings,
} from "playwright/playwrightUtils";

test("Program items missing required info show error messages", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programItemId: "valid-item",
      title: "Valid Program Item",
      startTime: startOfHour(
        addHours(new Date(config.event().eventStartTime), 1),
      ).toISOString(),
    },
    {
      ...testProgramItem,
      programItemId: "min-attendance-missing",
      title: "Min Attendance Missing",
      minAttendance: 0,
      startTime: startOfHour(
        addHours(new Date(config.event().eventStartTime), 2),
      ).toISOString(),
    },
    {
      ...testProgramItem,
      programItemId: "max-attendance-missing",
      title: "Max Attendance Missing",
      maxAttendance: 0,
      startTime: startOfHour(
        addHours(new Date(config.event().eventStartTime), 3),
      ).toISOString(),
    },
    {
      ...testProgramItem,
      programItemId: "min-bigger-than-max",
      title: "Min Bigger Than Max",
      minAttendance: 5,
      maxAttendance: 4,
      startTime: startOfHour(
        addHours(new Date(config.event().eventStartTime), 4),
      ).toISOString(),
    },
    {
      ...testProgramItem,
      programItemId: "signup-type-missing",
      title: "Signup Type Missing",
      signupType: SignupType.MISSING,
      startTime: startOfHour(
        addHours(new Date(config.event().eventStartTime), 5),
      ).toISOString(),
    },
    {
      ...testProgramItem,
      programItemId: "not-starting-on-even-hour",
      title: "Not Starting On Even Hour",
      // Only lottery sign-up program items have to start on the hour
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime: addMinutes(
        startOfHour(addHours(new Date(config.event().eventStartTime), 6)),
        30,
      ).toISOString(),
    },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await login(page, request, { username: "test1", password: "test" });

  const programList = new ProgramListPage(page);

  // The invalid query param lists every item missing required info
  await page.goto("/program/list?invalid");
  await expect(programList.items).toHaveCount(5);

  // Each invalid item shows the error message for its missing info
  await expect(
    programList.itemByTitle("Min Attendance Missing").errorMessages,
  ).toContainText("Missing info: minimum number of players");

  await expect(
    programList.itemByTitle("Max Attendance Missing").errorMessages,
  ).toContainText("Missing info: maximum number of players");

  await expect(
    programList.itemByTitle("Min Bigger Than Max").errorMessages,
  ).toContainText(
    "Missing info: minimum number of players is larger than maximum number",
  );

  await expect(
    programList.itemByTitle("Signup Type Missing").errorMessages,
  ).toContainText("Missing info: sign up type");

  await expect(
    programList.itemByTitle("Not Starting On Even Hour").errorMessages,
  ).toContainText(
    "Invalid start time: program items using lottery sign-up must start on the hour",
  );

  // The valid item shows no error messages
  await page.goto("/program/list");
  await expect(programList.items).toHaveCount(6);
  await expect(
    programList.itemByTitle("Valid Program Item").errorMessages,
  ).toBeHidden();
});
