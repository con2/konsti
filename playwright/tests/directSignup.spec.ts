import { expect, test } from "@playwright/test";
import { addHours, addMinutes, subMinutes } from "date-fns";
import { config } from "shared/config";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
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
  testPostDirectSignup,
  testPostLotterySignup,
} from "playwright/playwrightUtils";

const alwaysOpenTitle = "Always open item";

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
      startTime: hoursIntoEvent(1),
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

  // Direct sign-up to first program item
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  const directSignupProgramItemTitle =
    await firstProgramItem.title.textContent();

  await expect(firstProgramItem.container).toContainText("0/4 sign-ups");

  // Add direct sign-up to another user on the background
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

  // Go to My Program and check direct sign-up program item title
  await programList.gotoMyProgram();

  const programItemTitle = await programList.directSignupList
    .getByTestId("program-item-title")
    .textContent();

  expect(programItemTitle?.trim()).toEqual(directSignupProgramItemTitle);

  // Cancel direct sign-up on My Program page
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
      startTime: hoursIntoEvent(1),
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
      startTime: hoursIntoEvent(1),
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

  // Direct sign-up to first program item
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();

  await expect(firstProgramItem.container).toContainText("0/1 sign-ups");

  // Add direct sign-up to another user on the background
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
  const startTime = hoursIntoEvent(1);
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime,
    },
  ]);

  // Sign up test1 while direct sign-up is open, then move time past the start
  // when direct sign-up has ended
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await testPostDirectSignup(request, "test1", {
    directSignupProgramItemId: testProgramItem.programItemId,
    message: "",
  });
  await postTestSettings(request, {
    testTime: addHours(new Date(startTime), 1).toISOString(),
  });

  const programList = new ProgramListPage(page);

  // Logged out: past program items are only visible in the "All" view,
  // and the card shows no sign-up controls or messages
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
  const startTime = hoursIntoEvent(1);
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
  // Rolling direct sign-up opens 4 hours before the program item starts, so at
  // event start this item's sign-up is not open yet
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programItemId: "other-program-item",
      title: "Other test item",
      programType: config.event().rollingDirectSignupProgramTypes[0],
      startTime: hoursIntoEvent(6),
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

test("Open direct signup only once the gap after the lottery has passed", async ({
  page,
  request,
}) => {
  const startTime = hoursIntoEvent(4);
  // Derived from the two config values rather than from the app's own helper, so a change to
  // how the gap is applied shows up here instead of moving with it
  const { directSignupPhaseStart, phaseGap } = config.event();
  const lotterySignupEndTime = subMinutes(
    new Date(startTime),
    directSignupPhaseStart,
  );
  const directSignupStartTime = addMinutes(lotterySignupEndTime, phaseGap);

  await clearDb(request);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
    },
  ]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });

  // Inside the gap: the lottery has closed and its run is what fills the program item, so
  // nothing may be signed up to first come, first served yet
  await postTestSettings(request, {
    testTime: addMinutes(lotterySignupEndTime, 5).toISOString(),
  });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await programList.waitForItems();

  const programItem = programList.firstItem();
  await expect(programItem.lotterySignupButton).toBeHidden();
  await expect(programItem.signUpButton).toBeHidden();
  await expect(programItem.container).toContainText(
    "Participants were selected in a lottery.",
  );

  // Once the gap has passed it opens, and this is the only thing that changed
  await postTestSettings(request, {
    testTime: addMinutes(directSignupStartTime, 5).toISOString(),
  });
  await page.reload();
  await programList.waitForItems();

  // Taken rather than only offered, so the server is shown to open at the same moment
  await programItem.signUp();
  await programItem.confirm();
  await expect(programItem.cancelSignupButton).toBeVisible();
});

test("Direct signup keeps the lottery signups for the same time", async ({
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
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      endTime,
    },
    {
      // 'Sign-up always open', so its direct sign-up is open while the lottery for this
      // start time still hasn't run
      ...testProgramItem2,
      // A title that is not a superstring of the other item's, so looking one up by title
      // doesn't match both
      title: alwaysOpenTitle,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      tags: [Tag.PRE_CONVENTION_WEEK],
      startTime,
      endTime,
    },
  ]);

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  // A lottery sign-up for the same start time as the spot about to be taken
  await testPostLotterySignup(request, "test1", {
    programItemId: testProgramItem.programItemId,
    priority: 1,
  });

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  // Pre-convention week program is not in the upcoming list during the main event
  await programList.selectStartingTime("All");
  await programList.waitForItems();

  const alwaysOpenProgramItem = programList.itemByTitle(alwaysOpenTitle);
  await alwaysOpenProgramItem.signUp();
  await alwaysOpenProgramItem.confirm();

  // Holding a spot doesn't withdraw the attendee from the lottery for that time: the sign-up
  // stands, and if the lottery places them the spot they win replaces this one
  await programList.gotoMyProgram();
  await expect(programList.directSignupList).toContainText(alwaysOpenTitle);
  await expect(programList.lotterySignupList).toContainText(
    testProgramItem.title,
  );
});
