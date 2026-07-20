import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  addProgramItems,
  populateDb,
  postAssignment,
  postSettings,
  postTestSettings,
  testPostLotterySignup,
} from "playwright/playwrightUtils";
import { DashboardPage } from "playwright/pages/DashboardPage";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";

// The run card headings show the assignment time as Helsinki wall-clock time.
// The shared time formatter can't be imported here (its dayjs plugin imports
// don't resolve under Playwright's ESM loader), so the expected time is
// computed with Intl instead
const helsinkiTime = (time: string): string =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Helsinki",
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
  const startTime = dayjs(config.event().eventStartTime)
    .add(4, "hour")
    .startOf("hour")
    .toISOString();
  const endTime = dayjs(startTime)
    .add(testProgramItem.mins, "minutes")
    .toISOString();

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

  // Seed the lottery signup and run the lottery on the background
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
  const earlierStartTime = dayjs(config.event().eventStartTime)
    .add(4, "hour")
    .startOf("hour")
    .toISOString();
  const laterStartTime = dayjs(config.event().eventStartTime)
    .add(5, "hour")
    .startOf("hour")
    .toISOString();

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime: earlierStartTime,
      endTime: dayjs(earlierStartTime)
        .add(testProgramItem.mins, "minutes")
        .toISOString(),
      minAttendance: 1,
      maxAttendance: 1,
    },
    {
      ...testProgramItem2,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime: laterStartTime,
      endTime: dayjs(laterStartTime)
        .add(testProgramItem2.mins, "minutes")
        .toISOString(),
      minAttendance: 1,
      maxAttendance: 1,
    },
  ]);

  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  // One hour into the event both items' lottery signup windows are open -
  // the later item's window hasn't opened yet at the event start
  await postTestSettings(request, {
    testTime: dayjs(config.event().eventStartTime).add(1, "hour").toISOString(),
  });

  // Separate users per time slot so the first run's overlap cleanup can't
  // remove the second run's signup
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
  await expect(dashboard.runHeading(0)).toContainText(
    helsinkiTime(laterStartTime),
  );
  await expect(dashboard.runHeading(1)).toContainText(
    helsinkiTime(earlierStartTime),
  );
});
