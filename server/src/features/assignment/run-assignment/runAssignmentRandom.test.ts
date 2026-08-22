import { randomUUID } from "node:crypto";
import { addHours, addMinutes, subHours } from "date-fns";
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
import {
  findDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { EmailSender } from "server/features/notifications/email";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockLotterySignups,
  mockPostDirectSignupRequest,
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
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
  // Attendees placed by the first run hold a spot at this start time, so the second run
  // leaves them alone rather than re-assigning them or duplicating their assignment

  const assignResults2 = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm,
      assignmentTime,
    }),
  );

  // A run is allowed to place nobody, but it has to say so rather than reporting a
  // failure as an empty success, which an "is anyone re-assigned" check alone accepts
  expect(assignResults2.status).not.toEqual(AssignmentResultStatus.ERROR);

  const firstRunWinners = assignResults.results.map(
    (result) => result.username,
  );
  const firstRunWinnerSet = new Set(firstRunWinners);

  // No prior winner is included in the re-run results
  const reassignedPriorWinners = assignResults2.results.filter((result) =>
    firstRunWinnerSet.has(result.username),
  );
  expect(reassignedPriorWinners).toHaveLength(0);

  // The re-run may still place attendees the first one couldn't, so the spots as a whole
  // do change. What must not is where a prior winner sits: same attendee, same program
  // item, still exactly one spot each
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
});

test("Should adjust attendee limits if there are previous signups from moved program items", async () => {
  const assignmentAlgorithm = AssignmentAlgorithm.RANDOM;

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 2, maxAttendance: 3 },
  ]);
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveUser(mockUser3);
  await saveUser(mockUser4);

  // ** Save previous sign-ups

  // This should remain because of different startTime
  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    signedToStartTime: subHours(
      new Date(testProgramItem.startTime),
      1,
    ).toISOString(),
  });

  // This sign-up holds a spot at the assignment time, so it is kept and counted against
  // the program item's capacity
  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    username: mockUser2.username,
  });

  // ** Save selected program items

  // This will get assigned to the one spot left after the two existing sign-ups
  await saveLotterySignups({
    username: mockUser3.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  // This will not get assigned because program item full
  await saveLotterySignups({
    username: mockUser4.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 3 }],
  });

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm,
      assignmentTime: testProgramItem.startTime,
    }),
  );
  expect(assignResults.status).toEqual("success");
  expect(assignResults.results.length).toEqual(1);

  const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

  const assignmentSignup = signupsAfterUpdate.find(
    (signup) => signup.programItemId === testProgramItem.programItemId,
  );

  expect(assignmentSignup?.userSignups).toMatchObject([
    {
      username: mockUser.username,
      signedToStartTime: subHours(
        new Date(testProgramItem.startTime),
        1,
      ).toISOString(),
      message: "",
      priority: 0,
    },
    {
      username: mockUser2.username,
      signedToStartTime: testProgramItem.startTime,
      message: "",
      priority: 0,
    },
    {
      username: mockUser3.username,
      signedToStartTime: testProgramItem.startTime,
      message: "",
      priority: 1,
    },
  ]);
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
