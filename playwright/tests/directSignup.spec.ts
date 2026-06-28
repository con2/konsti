import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  postTestSettings,
  login,
  addProgramItems,
  clearDb,
  testPostDirectSignup,
  populateDb,
} from "playwright/playwrightUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";

test("Add and cancel direct signup", async ({ page, request }) => {
  await clearDb(request);
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
  });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime: dayjs(config.event().eventStartTime)
        .add(1, "hour")
        .startOf("hour")
        .toISOString(),
    },
  ]);
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);

  // Navigate to program list tab and select RPG program type
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");

  // Direct signup to first program item
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  const directSignupProgramItemTitle =
    await firstProgramItem.title.textContent();

  await expect(firstProgramItem.container).toContainText("0/4 sign-ups");

  // Add direct signup to another user on the background
  await testPostDirectSignup(request, "test2", {
    directSignupProgramItemId: testProgramItem.programItemId,
    message: "",
    priority: 1,
  });

  await firstProgramItem.signUp();
  await firstProgramItem.confirm();

  // Check attendee count is incremented
  await expect(firstProgramItem.container).toContainText("2/4 sign-ups");
  await firstProgramItem.showPlayers();

  const participantList = firstProgramItem.participants;
  await expect(participantList).toHaveCount(2);
  await expect(participantList.nth(0)).toHaveText("test1");
  await expect(participantList.nth(1)).toHaveText("test2");

  // Go to My Program and check direct signup program item title
  await programList.gotoMyProgram();

  const programItemTitle = await programList.directSignupList
    .getByTestId("program-item-title")
    .textContent();

  expect(programItemTitle?.trim()).toEqual(directSignupProgramItemTitle);

  // Cancel direct signup on My Program page
  await programList.cancelSignup();
  await expect(
    programList.directSignupList.getByRole("paragraph"),
  ).toContainText(
    "No sign-ups to upcoming program. You can sign up in the All Program view.",
  );

  // Navigate back to program list and sign again and cancel
  await programList.gotoAllProgram();
  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");

  await firstProgramItem.signUp();
  await firstProgramItem.confirm();
  await expect(firstProgramItem.container).toContainText("2/4 sign-ups");

  await programList.cancelSignup();
  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");
});

test("Show error when program item full and update participant list", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
  });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime: dayjs(config.event().eventStartTime)
        .add(1, "hour")
        .startOf("hour")
        .toISOString(),
      minAttendance: 1,
      maxAttendance: 1,
    },
  ]);
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);

  // Navigate to program list tab and select RPG program type
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");

  // Direct signup to first program item
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  await expect(firstProgramItem.container).toContainText("0/1 sign-ups");

  // Add direct signup to another user on the background
  await testPostDirectSignup(request, "test2", {
    directSignupProgramItemId: testProgramItem.programItemId,
    message: "",
    priority: 1,
  });

  await firstProgramItem.signUp();
  await firstProgramItem.confirm();

  // Check program item full error
  await expect(firstProgramItem.fullMessage).toHaveText(
    "This roleplaying game is full.",
  );

  // Check attendee count is updated
  await expect(firstProgramItem.container).toContainText("1/1 sign-ups");
  await firstProgramItem.showPlayers();

  const participantList = firstProgramItem.participants;
  await expect(participantList).toHaveCount(1);
  await expect(participantList.nth(0)).toHaveText("test2");
});
