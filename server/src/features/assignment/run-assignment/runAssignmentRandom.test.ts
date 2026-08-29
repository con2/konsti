import { randomUUID } from "node:crypto";
import { addHours, addMinutes } from "date-fns";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { testProgramItem } from "shared/tests/testProgramItem";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramType } from "shared/types/models/programItem";
import { db } from "server/db/mongodb";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import {
  assertAssignmentInvariants,
  assertUserUpdatedCorrectly,
  firstLotterySignupSlot,
  generateTestData,
} from "server/features/assignment/run-assignment/runAssignmentTestUtils";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { EmailSender } from "server/features/notifications/email";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockLotterySignups,
  mockUser,
  mockUser2,
} from "server/test/mock-data/mockUser";
import { seedRandomness } from "server/test/utils/seedRandomness";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { AssignmentResultStatus } from "server/types/resultTypes";
import {
  createNotificationQueueService,
  getGlobalNotificationQueueService,
} from "server/utils/notificationQueue";

// This needs to be adjusted if test data is changed
const expectedResultsCount = 20;

vi.mock<object>(
  import("server/utils/notificationQueue"),
  async (originalImport) => {
    const actual = await originalImport();
    return {
      ...actual,
      getGlobalNotificationQueueService: vi.fn(),
    };
  },
);

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
  vi.mocked(getGlobalNotificationQueueService).mockReturnValue(
    createNotificationQueueService(new EmailSender(), 1, true),
  );
});

afterEach(async () => {
  vi.restoreAllMocks();
  await mongoose.disconnect();
});

test("Assignment with valid data should return success with random algorithm", async () => {
  const newUsersCount = 20;
  const groupSize = 3;
  const numberOfGroups = 5;
  const newProgramItemsCount = 10;
  const testUsersCount = 0;

  seedRandomness();

  await generateTestData(
    newUsersCount,
    newProgramItemsCount,
    groupSize,
    numberOfGroups,
    testUsersCount,
  );

  const { eventStartTime } = config.event();
  const assignmentAlgorithm = AssignmentAlgorithm.RANDOM;
  const assignmentTime = addHours(
    new Date(eventStartTime),
    firstLotterySignupSlot,
  ).toISOString();

  // FIRST RUN

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm,
      assignmentTime,
    }),
  );

  expect(assignResults.status).toEqual("success");
  expect(assignResults.results.length).toBeGreaterThanOrEqual(
    expectedResultsCount,
  );

  const updatedUsers = assignResults.results.map((result) => result.username);
  await assertUserUpdatedCorrectly(updatedUsers);
  await assertAssignmentInvariants(assignmentTime);

  // SECOND RUN
  // The lottery for a start time happens once, so running it again lotteries nothing and
  // leaves every spot the first run handed out where it is

  const assignResults2 = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm,
      assignmentTime,
    }),
  );

  expect(assignResults2.status).toEqual(
    AssignmentResultStatus.ALREADY_LOTTERIED,
  );
  expect(assignResults2.results).toHaveLength(0);

  const firstRunWinners = assignResults.results.map(
    (result) => result.username,
  );
  const firstRunWinnerSet = new Set(firstRunWinners);

  // Same attendee, same program item, still exactly one spot each
  const signupsAfterSecondRun = unsafelyUnwrap(await findDirectSignups());
  const heldProgramItemsByWinner = new Map(
    signupsAfterSecondRun.flatMap((signup) =>
      signup.userSignups
        .filter((userSignup) => firstRunWinnerSet.has(userSignup.username))
        .map((userSignup) => [userSignup.username, signup.programItemId]),
    ),
  );
  expect(heldProgramItemsByWinner.size).toEqual(firstRunWinnerSet.size);
  assignResults.results.map((result) => {
    expect(heldProgramItemsByWinner.get(result.username)).toEqual(
      result.assignmentSignup.programItemId,
    );
  });

  // Prior winners still have exactly one assignment (idempotent, not duplicated)
  await assertUserUpdatedCorrectly(firstRunWinners);

  await assertAssignmentInvariants(assignmentTime);
});

test("Assignment with no attendees should return error with random algorithm", async () => {
  const newUsersCount = 0;
  const groupSize = 0;
  const numberOfGroups = 0;
  const newProgramItemsCount = 1;
  const testUsersCount = 0;

  seedRandomness();

  await generateTestData(
    newUsersCount,
    newProgramItemsCount,
    groupSize,
    numberOfGroups,
    testUsersCount,
  );

  const { eventStartTime } = config.event();
  const assignmentAlgorithm = AssignmentAlgorithm.RANDOM;
  const assignmentTime = addHours(new Date(eventStartTime), 2).toISOString();

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm,
      assignmentTime,
    }),
  );

  expect(assignResults.status).toEqual(
    AssignmentResultStatus.NO_LOTTERY_SIGNUPS,
  );
});

test("Should assign user with 'startTimesByParentIds' program item", async () => {
  const parentStartTime = addMinutes(
    new Date(testProgramItem.startTime),
    30,
  ).toISOString();

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
  ]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  const assignmentAlgorithm = AssignmentAlgorithm.RANDOM;

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm,
      assignmentTime: parentStartTime,
    }),
  );

  expect(assignResults.status).toEqual(AssignmentResultStatus.SUCCESS);
  expect(assignResults.results).toHaveLength(1);
  expect(assignResults.results[0]).toMatchObject({
    username: mockUser.username,
    assignmentSignup: {
      programItemId: testProgramItem.programItemId,
      priority: 1,
      signedToStartTime: testProgramItem.startTime,
    },
  });

  const userAfterSave = unsafelyUnwrap(await findUser(mockUser.username));
  expect(userAfterSave?.eventLogItems).toHaveLength(1);
  expect(userAfterSave?.eventLogItems[0].action).toEqual(
    EventLogAction.NEW_ASSIGNMENT,
  );
});

test("Should assign group with 'startTimesByParentIds' program item", async () => {
  const parentStartTime = addMinutes(
    new Date(testProgramItem.startTime),
    30,
  ).toISOString();

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 2, maxAttendance: 2 },
  ]);

  const groupCode = "123-234-345";

  await saveUser({ ...mockUser, groupCode, isGroupCreator: true });
  await saveUser({ ...mockUser2, groupCode });

  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  const assignmentAlgorithm = AssignmentAlgorithm.RANDOM;

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm,
      assignmentTime: parentStartTime,
    }),
  );

  expect(assignResults.status).toEqual(AssignmentResultStatus.SUCCESS);
  expect(assignResults.results).toHaveLength(2);
  expect(assignResults.results).toMatchObject([
    {
      username: mockUser.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
    {
      username: mockUser2.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
  ]);
});
