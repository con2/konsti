import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  postSettings,
  postTestSettings,
  login,
  addProgramItems,
  clearDb,
  testPostDirectSignup,
  populateDb,
} from "playwright/playwrightUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { config } from "shared/config";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { testProgramItem } from "shared/tests/testProgramItem";
import { ProgramType } from "shared/types/models/programItem";

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
    "No sign-ups for upcoming program items. You can sign up in the All Program view.",
  );

  // Navigate back to program list and sign again and cancel
  await programList.gotoAllProgram();
  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");

  await firstProgramItem.signUp();
  await firstProgramItem.confirm();
  await expect(firstProgramItem.container).toContainText("2/4 sign-ups");

  await firstProgramItem.cancelSignup();
  await firstProgramItem.confirmCancellation();
  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");
});

test("Show program item full message when logged out and logged in", async ({
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

  // Fill the program item with another user
  await testPostDirectSignup(request, "test2", {
    directSignupProgramItemId: testProgramItem.programItemId,
    message: "",
  });

  const programList = new ProgramListPage(page);

  // Logged out: the landing page is the program list without tabs,
  // and the full message is shown instead of the login link
  await page.goto("/");
  await programList.waitForItems();

  const firstProgramItem = programList.firstItem();
  await expect(firstProgramItem.fullMessage).toHaveText(
    "This role-playing game is full.",
  );
  await expect(firstProgramItem.container).not.toContainText(
    "Log in to sign up",
  );

  // Logged in: same full message is shown
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");
  await programList.gotoAllProgram();
  await programList.waitForItems();

  await expect(firstProgramItem.fullMessage).toHaveText(
    "This role-playing game is full.",
  );
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
  });

  await firstProgramItem.signUp();
  await firstProgramItem.confirm();

  // Check program item full error
  await expect(firstProgramItem.fullMessage).toHaveText(
    "This role-playing game is full.",
  );

  // Check attendee count is updated
  await expect(firstProgramItem.container).toContainText("1/1 sign-ups");
  await firstProgramItem.showPlayers();

  const participantList = firstProgramItem.participants;
  await expect(participantList).toHaveCount(1);
  await expect(participantList.nth(0)).toHaveText("test2");
});

test("Show no signup controls after direct signup has ended", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
  });
  const startTime = dayjs(config.event().eventStartTime)
    .add(1, "hour")
    .startOf("hour")
    .toISOString();
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime,
    },
  ]);

  // Sign up test1 while direct signup is open, then move time past the start
  // when direct signup has ended
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await testPostDirectSignup(request, "test1", {
    directSignupProgramItemId: testProgramItem.programItemId,
    message: "",
  });
  await postTestSettings(request, {
    testTime: dayjs(startTime).add(1, "hour").toISOString(),
  });

  const programList = new ProgramListPage(page);

  // Logged out: past program items are only visible in the "All" view,
  // and the card shows no signup controls or messages
  await page.goto("/");
  await programList.selectStartingTime("All");
  await programList.waitForItems();

  const firstProgramItem = programList.firstItem();
  await expect(firstProgramItem.title).toContainText("Test program item");
  await expect(firstProgramItem.container).toContainText("1/4 sign-ups");
  await expect(firstProgramItem.signUpButton).toBeHidden();
  await expect(firstProgramItem.container).not.toContainText(
    "Log in to sign up",
  );
  await expect(firstProgramItem.fullMessage).toBeHidden();
  await expect(firstProgramItem.container).not.toContainText("Sign-up closes");

  // Logged in and signed up: only the admission ticket link is shown
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");
  await programList.gotoAllProgram();
  await programList.selectStartingTime("All");
  await programList.waitForItems();

  await expect(firstProgramItem.admissionTicketLink).toBeVisible();
  await expect(firstProgramItem.signUpButton).toBeHidden();
  await expect(firstProgramItem.container).not.toContainText("Sign-up closes");
});

test("Show timeslot conflict message instead of signup button", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
  });
  const startTime = dayjs(config.event().eventStartTime)
    .add(1, "hour")
    .startOf("hour")
    .toISOString();
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime,
    },
    {
      ...testProgramItem,
      programItemId: "second-program-item",
      title: "Second test item",
      startTime,
    },
  ]);
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  // Sign up to the first program item, then view the other one starting at
  // the same time
  await testPostDirectSignup(request, "test1", {
    directSignupProgramItemId: testProgramItem.programItemId,
    message: "",
  });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");
  await programList.waitForItems();

  const conflictingProgramItem = programList.itemByTitle("Second test item");
  await expect(conflictingProgramItem.container).toContainText(
    "You have already signed up to the role-playing game Test program item",
  );
  await expect(conflictingProgramItem.container).toContainText(
    "You cannot sign up to another program item starting at the same time.",
  );
  await expect(conflictingProgramItem.signUpButton).toBeHidden();
});

test("Show no signup button before direct signup opens", async ({
  page,
  request,
}) => {
  await clearDb(request);
  await populateDb(request, {
    clean: true,
    users: true,
    admin: true,
  });
  // Rolling direct signup for 'other' program items opens 4 hours before the
  // program item starts, so at event start this item's signup is not open yet
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programItemId: "other-program-item",
      title: "Other test item",
      programType: ProgramType.OTHER,
      startTime: dayjs(config.event().eventStartTime)
        .add(6, "hours")
        .startOf("hour")
        .toISOString(),
    },
  ]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.DIRECT,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();

  const programItem = programList.firstItem();
  await expect(programItem.container).toContainText("Sign-up opens");
  await expect(programItem.signUpButton).toBeHidden();
  await expect(programItem.container).not.toContainText("Sign-up closes");
});
