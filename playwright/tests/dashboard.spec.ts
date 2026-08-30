import { expect, test } from "@playwright/test";
import { addHours, addMinutes } from "date-fns";
import { config } from "shared/config";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { TIMEZONE } from "shared/utils/timezone";
import { DashboardPage } from "playwright/pages/DashboardPage";
import {
  addProgramItems,
  hoursIntoEvent,
  populateDb,
  postAssignment,
  postSettings,
  postTestSettings,
  testPostLotterySignup,
} from "playwright/playwrightUtils";

// An oracle independent of the app's own formatter: asserting with that would
// make both sides move together, so losing the event timezone would still pass
const helsinkiTime = (time: string): string =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(time));

test("Show empty state when the lottery hasn't been run", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, admin: true });

  const dashboard = new DashboardPage(page);
  await dashboard.goto();

  await expect(dashboard.title).toBeVisible();
  await expect(dashboard.noResultsMessage).toBeVisible();
});

test("Show lottery results without login", async ({ page, request }) => {
  const startTime = hoursIntoEvent(4);
  const endTime = addMinutes(
    new Date(startTime),
    testProgramItem.mins,
  ).toISOString();

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      endTime,
      // Adjust min/max so user will get the spot
      minAttendance: 1,
      maxAttendance: 1,
    },
  ]);

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  // Seed the lottery sign-up and run the lottery on the background
  await testPostLotterySignup(request, "test1", {
    programItemId: testProgramItem.programItemId,
    priority: 1,
  });
  await postAssignment(request, startTime);

  const dashboard = new DashboardPage(page);
  await dashboard.goto();

  await expect(dashboard.title).toBeVisible();
  await expect(dashboard.assignmentRuns).toHaveCount(1);
  await expect(dashboard.assignmentRuns).toContainText("Algorithm");

  // Individual user results are not exposed on the dashboard
  await expect(dashboard.assignmentRuns).not.toContainText("test1");
});

// The run is recorded either way, so this is the dashboard's own filter rather than a missing
// record: a run that placed nobody has nothing for an attendee to read
test("Leave a lottery run that placed nobody out of the results", async ({
  page,
  request,
}) => {
  const startTime = hoursIntoEvent(4);
  const endTime = addMinutes(
    new Date(startTime),
    testProgramItem.mins,
  ).toISOString();

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      endTime,
      // Needs two attendees to run, and only one enters the lottery
      minAttendance: 2,
      maxAttendance: 2,
    },
  ]);

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });

  await testPostLotterySignup(request, "test1", {
    programItemId: testProgramItem.programItemId,
    priority: 1,
  });
  await postAssignment(request, startTime);

  const dashboard = new DashboardPage(page);
  await dashboard.goto();

  await expect(dashboard.title).toBeVisible();
  await expect(dashboard.assignmentRuns).toHaveCount(0);
  await expect(dashboard.noResultsMessage).toBeVisible();
});

test("Sort assignment runs latest first", async ({ page, request }) => {
  const earlierStartTime = hoursIntoEvent(4);
  const laterStartTime = hoursIntoEvent(5);

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime: earlierStartTime,
      endTime: addMinutes(
        new Date(earlierStartTime),
        testProgramItem.mins,
      ).toISOString(),
      minAttendance: 1,
      maxAttendance: 1,
    },
    {
      ...testProgramItem2,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime: laterStartTime,
      endTime: addMinutes(
        new Date(laterStartTime),
        testProgramItem2.mins,
      ).toISOString(),
      minAttendance: 1,
      maxAttendance: 1,
    },
  ]);

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  // One hour into the event both items' lottery sign-up windows are open -
  // the later item's window hasn't opened yet at the event start
  await postTestSettings(request, {
    testTime: addHours(
      new Date(config.event().eventStartTime),
      1,
    ).toISOString(),
  });

  // Separate users per time slot so the first run's overlap cleanup can't
  // remove the second run's sign-up
  await testPostLotterySignup(request, "test1", {
    programItemId: testProgramItem.programItemId,
    priority: 1,
  });
  await testPostLotterySignup(request, "test2", {
    programItemId: testProgramItem2.programItemId,
    priority: 1,
  });

  // Run the earlier lottery first so the insertion order is oldest first -
  // the expected display order is the reverse of it
  await postAssignment(request, earlierStartTime);
  await postAssignment(request, laterStartTime);

  const dashboard = new DashboardPage(page);
  await dashboard.goto();

  await expect(dashboard.assignmentRuns).toHaveCount(2);

  // Headings show the assignment time in the event timezone, latest run first.
  // The expected value is derived with Intl rather than with the app's own
  // formatter, so dropping the timezone from that formatter fails here instead
  // of shifting both sides of the assertion together.
  await expect(dashboard.runHeading(0)).toContainText(
    helsinkiTime(laterStartTime),
  );
  await expect(dashboard.runHeading(1)).toContainText(
    helsinkiTime(earlierStartTime),
  );
});
