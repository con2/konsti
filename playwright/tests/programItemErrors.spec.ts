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
import { SignupType } from "shared/types/models/programItem";

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
      startTime: dayjs(config.event().eventStartTime)
        .add(1, "hour")
        .startOf("hour")
        .toISOString(),
    },
    {
      ...testProgramItem,
      programItemId: "min-attendance-missing",
      title: "Min Attendance Missing",
      minAttendance: 0,
      startTime: dayjs(config.event().eventStartTime)
        .add(2, "hour")
        .startOf("hour")
        .toISOString(),
    },
    {
      ...testProgramItem,
      programItemId: "max-attendance-missing",
      title: "Max Attendance Missing",
      maxAttendance: 0,
      startTime: dayjs(config.event().eventStartTime)
        .add(3, "hour")
        .startOf("hour")
        .toISOString(),
    },
    {
      ...testProgramItem,
      programItemId: "min-bigger-than-max",
      title: "Min Bigger Than Max",
      minAttendance: 5,
      maxAttendance: 4,
      startTime: dayjs(config.event().eventStartTime)
        .add(4, "hour")
        .startOf("hour")
        .toISOString(),
    },
    {
      ...testProgramItem,
      programItemId: "signup-type-missing",
      title: "Signup Type Missing",
      signupType: SignupType.MISSING,
      startTime: dayjs(config.event().eventStartTime)
        .add(5, "hour")
        .startOf("hour")
        .toISOString(),
    },
    {
      ...testProgramItem,
      programItemId: "not-starting-on-even-hour",
      title: "Not Starting On Even Hour",
      startTime: dayjs(config.event().eventStartTime)
        .add(6, "hour")
        .startOf("hour")
        .add(30, "minute")
        .toISOString(),
    },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });
  await login(page, request, { username: "test1", password: "test" });

  const programList = new ProgramListPage(page);

  // The invalid query param lists every item missing required info
  await page.goto("/program/list?programType=tabletoprpg&invalid");
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
  await page.goto("/program/list?programType=tabletoprpg");
  await expect(programList.items).toHaveCount(6);
  await expect(
    programList.itemByTitle("Valid Program Item").errorMessages,
  ).toBeHidden();
});
