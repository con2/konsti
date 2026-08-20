import { expect, test } from "@playwright/test";
import { addHours, addMinutes, startOfHour } from "date-fns";
import { config } from "shared/config";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { getTime } from "shared/utils/timeFormatter";
import { DashboardPage } from "playwright/pages/DashboardPage";
import {
  addProgramItems,
  populateDb,
  postAssignment,
  postSettings,
  postTestSettings,
  testPostLotterySignup,
} from "playwright/playwrightUtils";

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
  const startTime = startOfHour(
    addHours(new Date(config.event().eventStartTime), 4),
  ).toISOString();
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

test("Sort assignment runs latest first", async ({ page, request }) => {
  const earlierStartTime = startOfHour(
    addHours(new Date(config.event().eventStartTime), 4),
  ).toISOString();
  const laterStartTime = startOfHour(
    addHours(new Date(config.event().eventStartTime), 5),
  ).toISOString();

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

  // Headings show the assignment time in the event timezone, latest run first
  await expect(dashboard.runHeading(0)).toContainText(getTime(laterStartTime));
  await expect(dashboard.runHeading(1)).toContainText(
    getTime(earlierStartTime),
  );
});
