import { expect, test } from "@playwright/test";
import { addMinutes } from "date-fns";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { SignupType } from "shared/types/models/programItem";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  hoursIntoEvent,
  login,
  populateDb,
  postTestSettings,
  signupsOpenTime,
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
      startTime: hoursIntoEvent(1),
    },
    {
      ...testProgramItem,
      programItemId: "min-attendance-missing",
      title: "Min Attendance Missing",
      minAttendance: 0,
      startTime: hoursIntoEvent(2),
    },
    {
      ...testProgramItem,
      programItemId: "max-attendance-missing",
      title: "Max Attendance Missing",
      maxAttendance: 0,
      startTime: hoursIntoEvent(3),
    },
    {
      ...testProgramItem,
      programItemId: "min-bigger-than-max",
      title: "Min Bigger Than Max",
      minAttendance: 5,
      maxAttendance: 4,
      startTime: hoursIntoEvent(4),
    },
    {
      ...testProgramItem,
      programItemId: "signup-type-missing",
      title: "Signup Type Missing",
      signupType: SignupType.MISSING,
      startTime: hoursIntoEvent(5),
    },
    {
      ...testProgramItem,
      programItemId: "not-starting-on-even-hour",
      title: "Not Starting On Even Hour",
      // Only lottery sign-up program items have to start on the hour
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime: addMinutes(new Date(hoursIntoEvent(6)), 30).toISOString(),
    },
  ]);
  await postTestSettings(request, { testTime: signupsOpenTime() });
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
