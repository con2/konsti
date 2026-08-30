import { randomUUID } from "node:crypto";
import { addHours, addMinutes, subHours } from "date-fns";
import mongoose from "mongoose";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import {
  AssignmentAlgorithm,
  RemoveLotterySignupsStrategy,
} from "shared/config/eventConfigTypes";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { MongoDbError, QueueError } from "shared/types/api/errors";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramType, State } from "shared/types/models/programItem";
import { makeErrorResult } from "shared/utils/result";
import { hasLotteryAlreadyRun } from "shared/utils/signupTimes";
import { db } from "server/db/mongodb";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import {
  assertAssignmentInvariants,
  assertUserUpdatedCorrectly,
  firstLotterySignupSlot,
  generateTestData,
} from "server/features/assignment/run-assignment/runAssignmentTestUtils";
import {
  delDirectSignup,
  findDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { EmailSender } from "server/features/notifications/email";
import {
  findProgramItemById,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { ProgramItemModel } from "server/features/program-item/programItemSchema";
import { findResults } from "server/features/results/resultsRepository";
import { saveSettings } from "server/features/settings/settingsRepository";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockLotterySignups,
  mockPostDirectSignupRequest,
  mockPostDirectSignupRequest2,
  mockUser,
  mockUser2,
  mockUser3,
} from "server/test/mock-data/mockUser";
import { seedRandomness } from "server/test/utils/seedRandomness";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { AssignmentResultStatus } from "server/types/resultTypes";
import {
  NotificationTaskType,
  createNotificationQueueService,
  getGlobalNotificationQueueService,
} from "server/utils/notificationQueue";

// Randomness is seeded per test, so the generated fixtures and the algorithm's shuffle produce
// the same assignment every run and the count can be exact rather than a floor. It is a snapshot
// of what this data yields, not a requirement - changing the fixtures or the algorithm moves it
const expectedResultsCount = 28;

vi.mock<object>(
  import("server/utils/notificationQueue"),
  async (originalImport) => {
    const actual = await originalImport();
    return {
      ...actual,
      getGlobalNotificationQueueService: vi.fn(() => {
        return createNotificationQueueService(new EmailSender(), 1, true);
      }),
    };
  },
);

// Pass-through wrapper so single tests can override the event log writes
// with an error result; vi.resetAllMocks restores the real implementation
vi.mock(
  import("server/features/user/event-log/eventLogRepository"),
  async (originalImport) => {
    const actual = await originalImport();
    return {
      ...actual,
      addEventLogItems: vi.fn(actual.addEventLogItems),
    };
  },
);

beforeEach(async () => {
  // afterEach resets all mocks including the setupTests config baseline, so re-establish
  // it here for tests that don't mock config.event themselves
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    eventStartTime: "2023-07-28T12:00:00Z", // Fri 15:00 GMT+3
    directSignupAlwaysOpenIds: ["1234"],
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.LARP],
    removeLotterySignupsStrategy: RemoveLotterySignupsStrategy.OVERLAP,
  });
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
});

afterEach(async () => {
  // Reset per-test config.event mocks so they don't leak into the next test
  vi.resetAllMocks();
  await mongoose.disconnect();
});

describe("Assignment with valid data", () => {
  beforeEach(async () => {
    const newUsersCount = 30;
    const groupSize = 3;
    const numberOfGroups = 10;
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
  });

  test("should return valid results after multiple executions on different times", async () => {
    const { eventStartTime } = config.event();
    const assignmentAlgorithm = AssignmentAlgorithm.PADG;
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
    expect(assignResults.results.length).toEqual(expectedResultsCount);

    const updatedUsers = assignResults.results.map((result) => result.username);
    await assertUserUpdatedCorrectly(updatedUsers);
    await assertAssignmentInvariants(assignmentTime);

    // SECOND RUN

    // One hour after the first slot: attendees assigned in the first run are still in
    // their 3h program items, so their overlapping lottery sign-ups have been removed
    const startTime2 = addHours(
      new Date(eventStartTime),
      firstLotterySignupSlot + 1,
    ).toISOString();

    const assignResults2Result = await runAssignment({
      assignmentAlgorithm,
      assignmentTime: startTime2,
    });
    expect(assignResults2Result.ok).toBe(true);
    const assignResults2 = unsafelyUnwrap(assignResults2Result);

    expect(assignResults2.results.length).toEqual(expectedResultsCount);

    const updatedUsers2 = assignResults2.results.map(
      (result) => result.username,
    );
    await assertUserUpdatedCorrectly(updatedUsers2);
    await assertAssignmentInvariants(startTime2);
  });
});

describe("Assignment with multiple program types and directSignupAlwaysOpen", () => {
  test("should replace a previous non-lottery sign-up with the spot the lottery gives", async () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
    });

    // ProgramItem1: 14:00 direct sign-up LARP
    // ProgramItem2: 14:00 lottery sign-up TABLETOP_RPG
    // A first-come-first-served spot doesn't settle the user, so they take part and the
    // LARP spot gives way to what they win - they can't attend both anyway
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;
    const assignmentTime = testProgramItem.startTime;

    await saveProgramItems([
      { ...testProgramItem, programType: ProgramType.LARP },
      {
        ...testProgramItem2,
        minAttendance: 1,
        startTime: assignmentTime,
      },
    ]);

    await saveUser(mockUser);

    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        {
          ...mockLotterySignups[1],
          signedToStartTime: assignmentTime,
        },
      ],
    });

    // User has previous direct LARP sign-up at the same start time
    await saveDirectSignup(mockPostDirectSignupRequest);
    const signupsBeforeUpdate = unsafelyUnwrap(await findDirectSignups());

    const programItemsWithSignups = signupsBeforeUpdate.filter(
      (signup) => signup.userSignups.length > 0,
    );
    expect(programItemsWithSignups).toHaveLength(1);
    expect(programItemsWithSignups[0].programItemId).toEqual(
      testProgramItem.programItemId,
    );

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime,
      }),
    );
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results).toHaveLength(1);

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

    const previousLarpSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(previousLarpSignup?.userSignups).toHaveLength(0);

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === testProgramItem2.programItemId,
    );
    expect(assignmentSignup?.userSignups).toHaveLength(1);
    expect(assignmentSignup?.userSignups[0].username).toEqual(
      mockUser.username,
    );
  });

  test("should not remove previous non-lottery signup if user doesn't have updated result", async () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
    });

    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
      {
        ...testProgramItem2,
        startTime: testProgramItem.startTime,
        programType: ProgramType.LARP,
        minAttendance: 1,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });
    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 2 }],
    });

    // This sign-up should not be removed even if start time is same as assignment time
    await saveDirectSignup({
      ...mockPostDirectSignupRequest2,
      username: mockUser2.username,
      signedToStartTime: testProgramItem.startTime,
    });

    const signupsBeforeUpdate = unsafelyUnwrap(await findDirectSignups());

    const programItemsWithSignups = signupsBeforeUpdate.filter(
      (signup) => signup.userSignups.length > 0,
    );
    expect(programItemsWithSignups.length).toEqual(1);

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );

    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(1);
    assignResults.results.map((result) => {
      expect(result.assignmentSignup.programItemId).toEqual(
        testProgramItem.programItemId,
      );
    });

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );

    const directSignupAlwaysOpenSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === testProgramItem2.programItemId,
    );

    expect(assignmentSignup?.userSignups.length).toEqual(1);
    expect(directSignupAlwaysOpenSignup?.userSignups.length).toEqual(1);
    expect(directSignupAlwaysOpenSignup?.userSignups[0].username).toEqual(
      mockUser2.username,
    );
  });

  test("should replace a 'directSignupAlwaysOpen' direct sign-up with the spot the lottery gives", async () => {
    const directSignupAlwaysOpenId = "1234";
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      directSignupAlwaysOpenIds: [directSignupAlwaysOpenId],
    });

    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1 },
      {
        ...testProgramItem2,
        startTime: testProgramItem.startTime,
        programItemId: directSignupAlwaysOpenId,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        { ...mockLotterySignups[0], priority: 2 },
        {
          // directSignupAlwaysOpen signed program item should be ignored
          programItemId: directSignupAlwaysOpenId,
          priority: 1,
          signedToStartTime: testProgramItem.startTime,
        },
      ],
    });
    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [
        { ...mockLotterySignups[0], priority: 2 },
        {
          // directSignupAlwaysOpen signed program item should be ignored
          programItemId: directSignupAlwaysOpenId,
          priority: 1,
          signedToStartTime: testProgramItem.startTime,
        },
      ],
    });

    // An always-open spot is first-come-first-served, so it doesn't settle mockUser: they
    // stay in the lottery and the spot it gives them takes the place of this one
    await saveDirectSignup({
      ...mockPostDirectSignupRequest2,
      signedToStartTime: testProgramItem.startTime,
      directSignupProgramItemId: directSignupAlwaysOpenId,
    });

    const signupsBeforeUpdate = unsafelyUnwrap(await findDirectSignups());

    expect(signupsBeforeUpdate.length).toEqual(2);

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );

    expect(assignResults.status).toEqual("success");
    expect(
      assignResults.results
        .map((result) => result.username)
        .toSorted((a, b) => a.localeCompare(b)),
    ).toEqual(
      [mockUser.username, mockUser2.username].toSorted((a, b) =>
        a.localeCompare(b),
      ),
    );

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    const directSignupAlwaysOpenSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === directSignupAlwaysOpenId,
    );

    expect(assignmentSignup?.userSignups.length).toEqual(2);
    expect(directSignupAlwaysOpenSignup?.userSignups.length).toEqual(0);
  });

  test("should not remove 'directSignupAlwaysOpen' signups if user doesn't have updated result", async () => {
    const directSignupAlwaysOpenId = "1234";
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      directSignupAlwaysOpenIds: [directSignupAlwaysOpenId],
    });

    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1 },
      {
        ...testProgramItem2,
        startTime: testProgramItem.startTime,
        programItemId: directSignupAlwaysOpenId,
        minAttendance: 1,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        { ...mockLotterySignups[0], priority: 2 },
        {
          // directSignupAlwaysOpen signed program item should be ignored
          programItemId: directSignupAlwaysOpenId,
          priority: 1,
          signedToStartTime: testProgramItem.startTime,
        },
      ],
    });

    // This sign-up should not be removed even if start time is same as assignment time
    await saveDirectSignup({
      ...mockPostDirectSignupRequest2,
      username: mockUser2.username,
      signedToStartTime: testProgramItem.startTime,
      directSignupProgramItemId: directSignupAlwaysOpenId,
    });

    const signupsBeforeUpdate = unsafelyUnwrap(await findDirectSignups());

    const programItemsWithSignups = signupsBeforeUpdate.filter(
      (signup) => signup.userSignups.length > 0,
    );
    expect(programItemsWithSignups.length).toEqual(1);

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );

    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(1);
    assignResults.results.map((result) => {
      expect(result.assignmentSignup.programItemId).toEqual(
        testProgramItem.programItemId,
      );
    });

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );

    const directSignupAlwaysOpenSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === directSignupAlwaysOpenId,
    );

    expect(assignmentSignup?.userSignups.length).toEqual(1);
    expect(directSignupAlwaysOpenSignup?.userSignups.length).toEqual(1);
    expect(directSignupAlwaysOpenSignup?.userSignups[0].username).toEqual(
      mockUser2.username,
    );
  });

  test("should replace a direct sign-up from a moved program item with the spot the lottery gives", async () => {
    // ProgramItem1: 14:00 direct sign-up -> program item moved to 15:00
    // ProgramItem2: 15:00 lottery sign-up
    // A spot they took themselves doesn't keep them out of the lottery: what it gives them
    // replaces it
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    const assignmentTime = addHours(
      new Date(testProgramItem.startTime),
      1,
    ).toISOString();

    await saveProgramItems([
      { ...testProgramItem },
      {
        ...testProgramItem2,
        minAttendance: 1,
        startTime: assignmentTime,
      },
    ]);
    await saveUser(mockUser);

    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        {
          ...mockLotterySignups[1],
        },
      ],
    });

    // User has previous sign-up from the moved program item
    await saveDirectSignup(mockPostDirectSignupRequest);

    await ProgramItemModel.updateOne(
      { programItemId: testProgramItem.programItemId },
      {
        startTime: assignmentTime,
      },
    );

    const signupsBeforeUpdate = unsafelyUnwrap(await findDirectSignups());
    const programItemsWithSignups = signupsBeforeUpdate.filter(
      (signup) => signup.userSignups.length > 0,
    );
    expect(programItemsWithSignups).toHaveLength(1);

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime,
      }),
    );
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results).toHaveLength(1);

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

    const signupFromMovedProgramItem = signupsAfterUpdate.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(signupFromMovedProgramItem?.userSignups).toHaveLength(0);

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === testProgramItem2.programItemId,
    );
    expect(assignmentSignup?.userSignups).toHaveLength(1);
    expect(assignmentSignup?.userSignups[0].username).toEqual(
      mockUser.username,
    );
  });

  test("should not remove previous signup from moved program item if user doesn't have updated result", async () => {
    // User1, programItem1: 14:00 direct sign-up -> program item moved 15:00
    // User2, programItem2: 15:00 lottery sign-up -> doesn't affect user1 sign-up
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    const assignmentTime = addHours(
      new Date(testProgramItem.startTime),
      1,
    ).toISOString();

    await saveProgramItems([
      { ...testProgramItem },
      {
        ...testProgramItem2,
        minAttendance: 1,
        startTime: assignmentTime,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    // User 1 has previous sign-up from moved program item - this sign-up should not be removed
    await saveDirectSignup(mockPostDirectSignupRequest);

    await ProgramItemModel.updateOne(
      { programItemId: testProgramItem.programItemId },
      {
        startTime: assignmentTime,
      },
    );

    // User 2 has selected program item for assignment
    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [{ ...mockLotterySignups[1] }],
    });

    const signupsBeforeUpdate = unsafelyUnwrap(await findDirectSignups());
    const programItemsWithSignups = signupsBeforeUpdate.filter(
      (signup) => signup.userSignups.length > 0,
    );
    expect(programItemsWithSignups).toHaveLength(1);

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime,
      }),
    );
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results).toHaveLength(1);
    assignResults.results.map((result) => {
      expect(result.assignmentSignup.programItemId).toEqual(
        testProgramItem2.programItemId,
      );
    });

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

    const previousSignupFromMovedProgramItem = signupsAfterUpdate.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(previousSignupFromMovedProgramItem?.userSignups).toHaveLength(1);
    expect(previousSignupFromMovedProgramItem?.userSignups[0].username).toEqual(
      mockUser.username,
    );

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === testProgramItem2.programItemId,
    );
    expect(assignmentSignup?.userSignups).toHaveLength(1);
    expect(assignmentSignup?.userSignups[0].username).toEqual(
      mockUser2.username,
    );
  });
});

describe("Assignment with first time bonus", () => {
  test("should assign user without previous lottery signup", async () => {
    const directSignupAlwaysOpenId = "1234";

    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
      directSignupAlwaysOpenIds: [directSignupAlwaysOpenId],
    });

    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      directSignupAlwaysOpenIds: [directSignupAlwaysOpenId],
    });

    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;
    const tournamentProgramItemId = "AIAHHUA";

    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
      testProgramItem2,
      {
        ...testProgramItem2,
        programType: ProgramType.TOURNAMENT,
        programItemId: tournamentProgramItemId,
      },
      {
        ...testProgramItem2,
        programItemId: directSignupAlwaysOpenId,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });

    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 3 }],
    });

    await saveDirectSignup({
      ...mockPostDirectSignupRequest2,
      username: mockUser.username,
      signedToStartTime: subHours(
        new Date(testProgramItem.startTime),
        1,
      ).toISOString(),
    });

    // Non-lottery sign-up (tournament) should not affect the bonus
    await saveDirectSignup({
      username: mockUser2.username,
      directSignupProgramItemId: tournamentProgramItemId,
      signedToStartTime: subHours(
        new Date(testProgramItem.startTime),
        1,
      ).toISOString(),
      signupTime: testProgramItem.startTime,
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });

    // 'directSignupAlwaysOpen' sign-up should not affect the bonus
    await saveDirectSignup({
      username: mockUser2.username,
      directSignupProgramItemId: directSignupAlwaysOpenId,
      signedToStartTime: subHours(
        new Date(testProgramItem.startTime),
        2,
      ).toISOString(),
      signupTime: testProgramItem.startTime,
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });

    const signupsBeforeUpdate = unsafelyUnwrap(await findDirectSignups());
    const programItemsWithSignups = signupsBeforeUpdate.filter(
      (signup) => signup.userSignups.length > 0,
    );
    expect(programItemsWithSignups.length).toEqual(3);

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
    expect(assignmentSignup?.userSignups[0]).toMatchObject({
      username: mockUser2.username,
      signedToStartTime: testProgramItem.startTime,
      message: "",
      priority: 3,
    });

    const previousRpgSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === testProgramItem2.programItemId,
    );
    expect(previousRpgSignup?.userSignups[0]).toMatchObject({
      username: mockUser.username,
      signedToStartTime: subHours(
        new Date(testProgramItem.startTime),
        1,
      ).toISOString(),
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });

    const previousTournamentSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === tournamentProgramItemId,
    );
    expect(previousTournamentSignup?.userSignups[0]).toMatchObject({
      username: mockUser2.username,
      signedToStartTime: subHours(
        new Date(testProgramItem.startTime),
        1,
      ).toISOString(),
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });

    const previousDirectSignupAlwaysOpenSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === directSignupAlwaysOpenId,
    );
    expect(previousDirectSignupAlwaysOpenSignup?.userSignups[0]).toMatchObject({
      username: mockUser2.username,
      signedToStartTime: subHours(
        new Date(testProgramItem.startTime),
        2,
      ).toISOString(),
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });
  });

  test("should assign user with previous failed lottery signup", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
      { ...testProgramItem2, minAttendance: 1, maxAttendance: 1 },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await addEventLogItems([
      {
        username: mockUser2.username,
        programItemId: testProgramItem.programItemId,
        programItemStartTime: testProgramItem.startTime,
        createdAt: new Date().toISOString(),
        action: EventLogAction.NO_ASSIGNMENT,
      },
    ]);

    // First user has higher priority but second user has additional first time bonus
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [{ ...mockLotterySignups[1], priority: 1 }],
    });
    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [{ ...mockLotterySignups[1], priority: 3 }],
    });

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem2.startTime,
      }),
    );
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(1);

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());
    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.programItemId === testProgramItem2.programItemId,
    );

    expect(assignmentSignup?.programItemId).toEqual(
      mockLotterySignups[1].programItemId,
    );
    expect(assignmentSignup?.userSignups[0]).toMatchObject({
      username: mockUser2.username,
      signedToStartTime: testProgramItem2.startTime,
      message: "",
      priority: 3,
    });
  });
});

describe("The lottery for a start time runs once", () => {
  test("does nothing when the start time has already been lotteried", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 3 },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });

    const firstRun = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );
    expect(firstRun.results.map((result) => result.username)).toEqual([
      mockUser.username,
    ]);

    // A second attendee enters and the start time is run again with two of its three spots
    // still free, so the run has something it could hand out and refuses anyway
    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });

    const secondRun = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );
    expect(secondRun.status).toEqual(AssignmentResultStatus.ALREADY_LOTTERIED);
    expect(secondRun.results).toHaveLength(0);

    const signups = unsafelyUnwrap(await findDirectSignups());
    const programItemSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(
      programItemSignup?.userSignups.map((userSignup) => userSignup.username),
    ).toEqual([mockUser.username]);

    // The second run decided nothing, so it told nobody anything
    const user2 = unsafelyUnwrap(await findUser(mockUser2.username));
    expect(user2?.eventLogItems).toHaveLength(0);
  });

  test("does not reopen a lotteried start time when preferences change", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    // testProgramItem2 starts at the same time and stays empty, so there is somewhere for
    // the lottery to move mockUser to if it wrongly treats the start time as still open
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
      {
        ...testProgramItem2,
        startTime: testProgramItem.startTime,
        minAttendance: 1,
        maxAttendance: 1,
      },
    ]);
    await saveUser(mockUser);

    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 2 }],
    });

    const firstRun = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );
    expect(firstRun.results).toHaveLength(1);
    expect(firstRun.results[0].assignmentSignup.programItemId).toEqual(
      testProgramItem.programItemId,
    );

    // They now add the empty program item as their first preference
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        { ...mockLotterySignups[0], priority: 2 },
        {
          ...mockLotterySignups[1],
          priority: 1,
          signedToStartTime: testProgramItem.startTime,
        },
      ],
    });

    const secondRun = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );
    expect(secondRun.status).toEqual(AssignmentResultStatus.ALREADY_LOTTERIED);
    expect(secondRun.results).toHaveLength(0);

    const signups = unsafelyUnwrap(await findDirectSignups());
    const firstItemSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(firstItemSignup?.userSignups).toHaveLength(1);
    expect(firstItemSignup?.userSignups[0].username).toEqual(mockUser.username);
    const secondItemSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem2.programItemId,
    );
    expect(secondItemSignup?.userSignups).toHaveLength(0);

    // Still exactly one "you got a spot" entry, from the run that placed them
    const user = unsafelyUnwrap(await findUser(mockUser.username));
    expect(
      user?.eventLogItems.filter(
        (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
      ),
    ).toHaveLength(1);
  });

  test("acts on a lottery preference even when the attendee holds a first-come-first-served spot", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 2 },
      {
        ...testProgramItem2,
        startTime: testProgramItem.startTime,
        minAttendance: 1,
        maxAttendance: 2,
      },
    ]);
    await saveUser(mockUser);

    // First-come-first-served spot on testProgramItem...
    await saveDirectSignup({
      ...mockPostDirectSignupRequest,
      username: mockUser.username,
    });

    // ...but a lottery preference for testProgramItem2 at the same time
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        {
          ...mockLotterySignups[1],
          priority: 1,
          signedToStartTime: testProgramItem.startTime,
        },
      ],
    });

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );

    // A spot they signed up for themselves doesn't settle them, so their lottery preference
    // is acted on and the spot they held gives way to it
    expect(assignResults.status).toEqual(AssignmentResultStatus.SUCCESS);
    expect(assignResults.results).toHaveLength(1);
    expect(assignResults.results[0].assignmentSignup.programItemId).toEqual(
      testProgramItem2.programItemId,
    );

    const signups = unsafelyUnwrap(await findDirectSignups());
    const firstComeSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(firstComeSignup?.userSignups).toHaveLength(0);
    const preferenceSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem2.programItemId,
    );
    expect(preferenceSignup?.userSignups).toHaveLength(1);
    expect(preferenceSignup?.userSignups[0].username).toEqual(
      mockUser.username,
    );
  });

  // A group has to land in one program item or none - splitting it is confusing, and a member
  // is only in the lottery through the creator's sign-ups in the first place. So a
  // first-come-first-served sign-up doesn't settle its holder: they take part with the rest of
  // the group and the spot the lottery gives them replaces it
  test.each([
    { role: "creator", username: mockUser.username },
    { role: "member", username: mockUser2.username },
  ])(
    "places the whole group when the $role holds a non-lottery direct signup at the same time",
    async ({ username }) => {
      const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;
      const groupCode = "group-with-one-direct-signup";
      const alwaysOpenId = "1234";

      await saveProgramItems([
        { ...testProgramItem, minAttendance: 1, maxAttendance: 3 },
        // 'directSignupAlwaysOpenIds' contains "1234", so this one is outside the lottery
        {
          ...testProgramItem2,
          programItemId: alwaysOpenId,
          startTime: testProgramItem.startTime,
          maxAttendance: 3,
        },
      ]);
      await saveUser({ ...mockUser, groupCode, isGroupCreator: true });
      await saveUser({ ...mockUser2, groupCode, isGroupCreator: false });
      await saveUser({ ...mockUser3, groupCode, isGroupCreator: false });

      await saveDirectSignup({
        ...mockPostDirectSignupRequest,
        directSignupProgramItemId: alwaysOpenId,
        signedToStartTime: testProgramItem.startTime,
        username,
      });

      await saveLotterySignups({
        username: mockUser.username,
        lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
      });

      const assignResults = unsafelyUnwrap(
        await runAssignment({
          assignmentAlgorithm,
          assignmentTime: testProgramItem.startTime,
        }),
      );

      expect(assignResults.status).toEqual(AssignmentResultStatus.SUCCESS);
      const placedUsernames = assignResults.results.map(
        (result) => result.username,
      );
      expect(placedUsernames.toSorted((a, b) => a.localeCompare(b))).toEqual(
        [mockUser.username, mockUser2.username, mockUser3.username].toSorted(
          (a, b) => a.localeCompare(b),
        ),
      );

      const signups = unsafelyUnwrap(await findDirectSignups());
      // The whole group lands in the same program item
      const programItemSignup = signups.find(
        (signup) => signup.programItemId === testProgramItem.programItemId,
      );
      expect(programItemSignup?.userSignups).toHaveLength(3);
      expect(programItemSignup?.count).toEqual(3);

      // The sign-up they held for this start time gave way to what they won
      const alwaysOpenSignup = signups.find(
        (signup) => signup.programItemId === alwaysOpenId,
      );
      expect(alwaysOpenSignup?.userSignups).toHaveLength(0);
      expect(alwaysOpenSignup?.count).toEqual(0);
    },
  );

  test("should lottery a program item moved to another start time before it was ever lotteried", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;
    const laterStartTime = addHours(
      new Date(testProgramItem.startTime),
      1,
    ).toISOString();

    // Moving is not what ends a program item's lottery - the mark left by one that ran is.
    // An item whose lottery never happened still gets it, at whatever slot it ends up in
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 2 },
    ]);
    await saveUser(mockUser);

    await saveProgramItems([
      {
        ...testProgramItem,
        minAttendance: 1,
        maxAttendance: 2,
        startTime: laterStartTime,
      },
    ]);
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        {
          ...mockLotterySignups[0],
          priority: 1,
          signedToStartTime: laterStartTime,
        },
      ],
    });

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: laterStartTime,
      }),
    );

    expect(assignResults.results.map((result) => result.username)).toEqual([
      mockUser.username,
    ]);
    expect(assignResults.results[0].assignmentSignup.programItemId).toEqual(
      testProgramItem.programItemId,
    );
  });

  test("should not lottery a program item again after it moves to another start time", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;
    const laterStartTime = addHours(
      new Date(testProgramItem.startTime),
      1,
    ).toISOString();

    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 2 },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });

    const firstRun = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );
    expect(firstRun.results).toHaveLength(1);

    // The item moves to a slot whose lottery has not run, and someone signs up for the
    // spot it still has free
    await saveProgramItems([
      {
        ...testProgramItem,
        minAttendance: 1,
        maxAttendance: 2,
        startTime: laterStartTime,
      },
    ]);
    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [
        {
          ...mockLotterySignups[0],
          priority: 1,
          signedToStartTime: laterStartTime,
        },
      ],
    });

    const secondRun = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: laterStartTime,
      }),
    );

    // Its lottery already happened, so the free spot goes to direct sign-up instead
    expect(secondRun.results).toHaveLength(0);

    const signups = unsafelyUnwrap(await findDirectSignups());
    const programItemSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(
      programItemSignup?.userSignups.map((userSignup) => userSignup.username),
    ).toEqual([mockUser.username]);
  });

  test("leaves a program item holding first-come-first-served sign-ups out of the lottery", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    // Direct sign-up for a lottery program item opens only once the gap after its lottery
    // has passed, so anything already in one means it has been taking sign-ups by another
    // rule. Deciding the same program item twice over is what the run avoids
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 3 },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveDirectSignup({
      ...mockPostDirectSignupRequest,
      username: mockUser.username,
    });

    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );
    expect(assignResults.results).toHaveLength(0);

    const signups = unsafelyUnwrap(await findDirectSignups());
    const programItemSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(
      programItemSignup?.userSignups.map((userSignup) => userSignup.username),
    ).toEqual([mockUser.username]);

    // They took part and heard the outcome, so they know to go and take a spot themselves
    const user2 = unsafelyUnwrap(await findUser(mockUser2.username));
    expect(
      user2?.eventLogItems.map((eventLogItem) => eventLogItem.action),
    ).toEqual([EventLogAction.NO_ASSIGNMENT]);
  });

  test("lotteries the empty program items when another at the same start time is skipped", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    // Skipping one program item must not cost the rest of the start time its lottery. The
    // attendee still has a sign-up naming the skipped one, and the assigner rejects its whole
    // input over a preference it has no event for
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 3 },
      {
        ...testProgramItem2,
        startTime: testProgramItem.startTime,
        minAttendance: 1,
        maxAttendance: 3,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveDirectSignup({
      ...mockPostDirectSignupRequest,
      username: mockUser.username,
    });

    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [
        { ...mockLotterySignups[0], priority: 1 },
        {
          ...mockLotterySignups[1],
          priority: 2,
          signedToStartTime: testProgramItem.startTime,
        },
      ],
    });

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );

    expect(
      assignResults.results.map(
        (result) => result.assignmentSignup.programItemId,
      ),
    ).toEqual([testProgramItem2.programItemId]);
  });

  test("does not tell an attendee a run already placed that they got no spot", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    // What a run that saved its spots and then failed before marking them leaves behind, which
    // choice 7 allows to be run again: the spot is there, the program item is unmarked, and the
    // lottery sign-up is still live. The retry skips the program item as occupied, so the
    // attendee is absent from its results - but they were placed, and saying otherwise is
    // permanent
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
    ]);
    await saveUser(mockUser);
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });
    await saveDirectSignup({
      ...mockPostDirectSignupRequest,
      username: mockUser.username,
      priority: 1,
    });

    unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );

    const user = unsafelyUnwrap(await findUser(mockUser.username));
    expect(
      user?.eventLogItems.map((eventLogItem) => eventLogItem.action),
    ).toEqual([]);
  });

  test("does not reopen a lotteried start time for a program item added afterwards", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    // A start time goes through one lottery. A program item imported after it has run joins the
    // hour on direct sign-up rather than starting a second lottery among whoever signed up since
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 3 },
    ]);
    await saveUser(mockUser);
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });

    unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );

    // A second program item turns up at the same hour, and somebody enters its lottery
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 3 },
      {
        ...testProgramItem2,
        startTime: testProgramItem.startTime,
        minAttendance: 1,
        maxAttendance: 3,
      },
    ]);
    await saveUser(mockUser2);
    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [
        {
          ...mockLotterySignups[1],
          priority: 1,
          signedToStartTime: testProgramItem.startTime,
        },
      ],
    });

    const secondRun = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );

    expect(secondRun.status).toEqual(AssignmentResultStatus.ALREADY_LOTTERIED);
    expect(secondRun.results).toHaveLength(0);

    // The newcomer is recorded, so emptying it cannot put it into a lottery later either
    const programItem = unsafelyUnwrap(
      await findProgramItemById(testProgramItem2.programItemId),
    );
    expect(programItem.passedOverForLottery).toEqual(true);
  });

  test("writes no results record when every program item was skipped", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    // A run that put nothing through a lottery decided nothing, and a record for it would read
    // as a lottery that ran - the attendees still hear the outcome
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 3 },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveDirectSignup({
      ...mockPostDirectSignupRequest,
      username: mockUser.username,
    });
    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });

    unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );

    expect(unsafelyUnwrap(await findResults())).toHaveLength(0);

    // They took part, so they still hear that they got nothing
    const user2 = unsafelyUnwrap(await findUser(mockUser2.username));
    expect(
      user2?.eventLogItems.map((eventLogItem) => eventLogItem.action),
    ).toEqual([EventLogAction.NO_ASSIGNMENT]);
  });

  test("keeps a skipped program item on direct sign-up once its sign-ups are cancelled", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    // Emptying it must not put it back into a lottery - the decision is recorded rather than
    // re-derived from whether anybody happens to hold a spot right now
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 3 },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveDirectSignup({
      ...mockPostDirectSignupRequest,
      username: mockUser.username,
    });
    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });

    unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );

    await delDirectSignup({
      username: mockUser.username,
      directSignupProgramItemId: testProgramItem.programItemId,
    });

    const secondRun = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );
    expect(secondRun.status).toEqual(AssignmentResultStatus.ALREADY_LOTTERIED);
    expect(secondRun.results).toHaveLength(0);

    const signups = unsafelyUnwrap(await findDirectSignups());
    const programItemSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(programItemSignup?.userSignups).toHaveLength(0);
  });

  test("lotteries a program item that became a lottery item while still empty", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    // A program type change can turn a non-lottery program item into a lottery one. Its
    // direct sign-up never opened, so it is empty and gets its one lottery like any other -
    // which honours whoever entered it after the change
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 3 },
    ]);
    await saveUser(mockUser);

    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );
    expect(assignResults.results.map((result) => result.username)).toEqual([
      mockUser.username,
    ]);
  });

  test("skips a program item already holding lottery-placed sign-ups without blocking the rest", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    // The state a run that saved its spots and then failed before marking them leaves behind.
    // Each program item's spots are written in one atomic update, so the ones it reached are
    // whole and the ones it didn't are untouched - skipping just those keeps a single slipped
    // program item from costing everyone else at that start time their lottery
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 3 },
      {
        ...testProgramItem2,
        startTime: testProgramItem.startTime,
        minAttendance: 1,
        maxAttendance: 3,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);
    await saveUser(mockUser3);

    await saveDirectSignup({
      ...mockPostDirectSignupRequest,
      username: mockUser.username,
      priority: 1,
    });
    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [
        {
          ...mockLotterySignups[1],
          priority: 1,
          signedToStartTime: testProgramItem.startTime,
        },
      ],
    });
    // Two spots are free in the half-written program item, and this run must not hand them out
    await saveLotterySignups({
      username: mockUser3.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );

    // The untouched program item is lotteried as normal
    expect(assignResults.results).toHaveLength(1);
    expect(assignResults.results[0].assignmentSignup.programItemId).toEqual(
      testProgramItem2.programItemId,
    );

    const signups = unsafelyUnwrap(await findDirectSignups());
    // The half-written one keeps what it has, and its holder is neither moved nor re-decided
    const skippedSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(
      skippedSignup?.userSignups.map((userSignup) => userSignup.username),
    ).toEqual([mockUser.username]);
    expect(skippedSignup?.userSignups[0].priority).toEqual(1);

    // The hopeful took part and heard the outcome rather than being placed into it
    const user3 = unsafelyUnwrap(await findUser(mockUser3.username));
    expect(
      user3?.eventLogItems.map((eventLogItem) => eventLogItem.action),
    ).toEqual([EventLogAction.NO_ASSIGNMENT]);

    // Both are marked, so neither goes through a lottery later
    const secondRun = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );
    expect(secondRun.status).toEqual(AssignmentResultStatus.ALREADY_LOTTERIED);
  });

  test("keeps a group in the run when only some of it holds a moved-in spot", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;
    const groupCode = "group-with-one-cancelled-spot";
    const laterStartTime = addHours(
      new Date(testProgramItem.startTime),
      1,
    ).toISOString();

    // A group wins together and one member cancels their spot afterwards, so the program item
    // that is then rescheduled onto the group's next slot carries only some of them. Nothing
    // may withdraw the whole group over what one member happens to still hold
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 3 },
      {
        ...testProgramItem2,
        startTime: laterStartTime,
        minAttendance: 1,
        maxAttendance: 3,
      },
    ]);
    await saveUser({ ...mockUser, groupCode, isGroupCreator: true });
    await saveUser({ ...mockUser2, groupCode, isGroupCreator: false });

    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });

    const firstRun = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );
    expect(firstRun.results).toHaveLength(2);

    // One member gives their spot up, then the program item moves onto the group's next slot
    await delDirectSignup({
      username: mockUser2.username,
      directSignupProgramItemId: testProgramItem.programItemId,
    });
    await saveProgramItems([
      {
        ...testProgramItem,
        minAttendance: 1,
        maxAttendance: 3,
        startTime: laterStartTime,
      },
      {
        ...testProgramItem2,
        startTime: laterStartTime,
        minAttendance: 1,
        maxAttendance: 3,
      },
    ]);
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        {
          ...mockLotterySignups[1],
          priority: 1,
          signedToStartTime: laterStartTime,
        },
      ],
    });

    const laterRun = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: laterStartTime,
      }),
    );

    // Both of them, together, rather than neither
    expect(
      laterRun.results
        .map((result) => result.username)
        .toSorted((a, b) => a.localeCompare(b)),
    ).toEqual(
      [mockUser.username, mockUser2.username].toSorted((a, b) =>
        a.localeCompare(b),
      ),
    );

    const signups = unsafelyUnwrap(await findDirectSignups());
    const wonSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem2.programItemId,
    );
    expect(wonSignup?.userSignups).toHaveLength(2);
  });

  test("acts on the lottery sign-ups of someone holding a spot in a moved-in program item", async () => {
    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;
    const laterStartTime = addHours(
      new Date(testProgramItem.startTime),
      1,
    ).toISOString();

    // The program item they won is rescheduled onto a slot they have lottery sign-ups for.
    // Nobody expressed a preference between the two - the conflict did not exist when they
    // signed up - so the spot is treated like any other and gives way to what the lottery
    // hands them
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 2 },
      {
        ...testProgramItem2,
        startTime: laterStartTime,
        minAttendance: 1,
        maxAttendance: 2,
      },
    ]);
    await saveUser(mockUser);

    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
    });

    unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: testProgramItem.startTime,
      }),
    );

    // The program item they won moves onto the later slot, which they also have a lottery
    // sign-up for
    await saveProgramItems([
      {
        ...testProgramItem,
        minAttendance: 1,
        maxAttendance: 2,
        startTime: laterStartTime,
      },
      {
        ...testProgramItem2,
        startTime: laterStartTime,
        minAttendance: 1,
        maxAttendance: 2,
      },
    ]);
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        {
          ...mockLotterySignups[1],
          priority: 1,
          signedToStartTime: laterStartTime,
        },
      ],
    });

    const laterRun = unsafelyUnwrap(
      await runAssignment({
        assignmentAlgorithm,
        assignmentTime: laterStartTime,
      }),
    );
    expect(laterRun.results.map((result) => result.username)).toEqual([
      mockUser.username,
    ]);
    expect(laterRun.results[0].assignmentSignup.programItemId).toEqual(
      testProgramItem2.programItemId,
    );

    // What they won replaces the spot the moved program item brought with it
    const signups = unsafelyUnwrap(await findDirectSignups());
    const wonSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(wonSignup?.userSignups).toHaveLength(0);
    const otherSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem2.programItemId,
    );
    expect(
      otherSignup?.userSignups.map((userSignup) => userSignup.username),
    ).toEqual([mockUser.username]);
  });
});

test("Assignment with no program items should return error", async () => {
  const newUsersCount = 1;
  const groupSize = 0;
  const numberOfGroups = 0;
  const newProgramItemsCount = 0;
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
  const assignmentAlgorithm = AssignmentAlgorithm.PADG;
  const assignmentTime = addHours(new Date(eventStartTime), 2).toISOString();

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm,
      assignmentTime,
    }),
  );

  expect(assignResults.status).toEqual(
    AssignmentResultStatus.NO_STARTING_PROGRAM_ITEMS,
  );
});

test("Should not place anyone into a cancelled program item", async () => {
  // A cancelled program item keeps its lottery sign-ups once its lottery has run, rather than
  // having them removed, so nothing but this stops a later run putting attendees into
  // something that is not happening
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [testProgramItem.programType],
  });

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 2 },
  ]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  // Cancelled after the sign-ups were made
  await saveProgramItems([
    {
      ...testProgramItem,
      minAttendance: 1,
      maxAttendance: 2,
      state: State.CANCELLED,
    },
  ]);

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
      assignmentTime: testProgramItem.startTime,
    }),
  );

  expect(assignResults.results).toHaveLength(0);

  const signups = unsafelyUnwrap(await findDirectSignups());
  const cancelledProgramItemSignup = signups.find(
    (signup) => signup.programItemId === testProgramItem.programItemId,
  );
  expect(cancelledProgramItemSignup?.userSignups ?? []).toHaveLength(0);
});

test("Should not write a results snapshot when the run lotteried nothing", async () => {
  // The lottery runs on a timer, so most start times have nothing for it to do. Recording
  // those would bury the real results under empty ones
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [testProgramItem.programType],
    // Makes the only program item at this start time one the lottery never allocates
    directSignupAlwaysOpenIds: [testProgramItem.programItemId],
  });

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 2 },
  ]);
  await saveUser(mockUser);

  unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
      assignmentTime: testProgramItem.startTime,
    }),
  );

  expect(unsafelyUnwrap(await findResults())).toHaveLength(0);
});

test("Should write a results snapshot even when the lottery places nobody", async () => {
  // A start time the lottery did run for is recorded whatever the outcome
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [testProgramItem.programType],
  });

  // Needs two attendees, so the single sign-up below cannot be placed
  await saveProgramItems([
    { ...testProgramItem, minAttendance: 2, maxAttendance: 2 },
  ]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
      assignmentTime: testProgramItem.startTime,
    }),
  );
  expect(assignResults.results).toHaveLength(0);

  const savedResults = unsafelyUnwrap(await findResults());
  expect(savedResults).toHaveLength(1);
  expect(savedResults[0].results).toHaveLength(0);
});

test("Should write a snapshot of the lottery groups to the results collection", async () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [testProgramItem.programType],
  });

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 2, maxAttendance: 2 },
  ]);

  const groupCode = "123-234-345";
  await saveUser({ ...mockUser, groupCode, isGroupCreator: true });
  await saveUser({ ...mockUser2, groupCode });

  // Only the group creator stores lottery sign-ups; members inherit them
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm: AssignmentAlgorithm.PADG,
      assignmentTime: testProgramItem.startTime,
    }),
  );
  expect(assignResults.status).toEqual(AssignmentResultStatus.SUCCESS);

  const savedResults = unsafelyUnwrap(await findResults());
  expect(savedResults).toHaveLength(1);
  expect(savedResults[0].groups).toEqual([
    {
      groupCode,
      groupCreator: mockUser.username,
      groupMembers: [mockUser.username, mockUser2.username],
    },
  ]);
});

test("Program item with parent startTime from 'startTimesByParentIds' should not be picked for assignment on program item's own start time", async () => {
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
      // testProgramItem should be ignored since startup time is determined via parent
      assignmentTime: testProgramItem.startTime,
    }),
  );

  expect(assignResults.status).toEqual(
    AssignmentResultStatus.NO_STARTING_PROGRAM_ITEMS,
  );
});

test("Should keep a past lottery sign-up but not let it affect an upcoming lottery", async () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
    startTimesByParentIds: new Map(),
  });

  // Item whose lottery already ran (earlier start time)
  const pastProgramItem = {
    ...testProgramItem2,
    startTime: subHours(new Date(testProgramItem.startTime), 2).toISOString(),
  };
  // Item the upcoming lottery is for
  const currentProgramItem = {
    ...testProgramItem,
    minAttendance: 1,
    maxAttendance: 1,
  };

  await saveProgramItems([pastProgramItem, currentProgramItem]);
  await saveUser(mockUser);

  // User keeps a leftover lottery sign-up for the past item and also has one for the current item
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [
      {
        programItemId: pastProgramItem.programItemId,
        priority: 1,
        signedToStartTime: pastProgramItem.startTime,
      },
      {
        programItemId: currentProgramItem.programItemId,
        priority: 1,
        signedToStartTime: currentProgramItem.startTime,
      },
    ],
  });

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm: AssignmentAlgorithm.PADG,
      assignmentTime: currentProgramItem.startTime,
    }),
  );

  // Only the current item is assigned; the past sign-up is ignored by the upcoming lottery
  expect(assignResults.status).toEqual(AssignmentResultStatus.SUCCESS);
  expect(assignResults.results).toHaveLength(1);
  expect(assignResults.results[0]).toMatchObject({
    username: mockUser.username,
    assignmentSignup: {
      programItemId: currentProgramItem.programItemId,
      priority: 1,
      signedToStartTime: currentProgramItem.startTime,
    },
  });

  // The past lottery sign-up is preserved for data accuracy, not removed by the run
  const userAfterSave = unsafelyUnwrap(await findUser(mockUser.username));
  const pastSignup = userAfterSave?.lotterySignups.find(
    (signup) => signup.programItemId === pastProgramItem.programItemId,
  );
  expect(pastSignup).toBeDefined();
});

test("Should not fail assignment or skip overlap cleanup when notification queueing fails", async () => {
  // Notification queue is unavailable for the whole run
  vi.mocked(getGlobalNotificationQueueService).mockReturnValue(null);

  // Email notifications are enabled, so the run tries to queue them
  await saveSettings({
    emailNotificationTrigger: [
      EmailNotificationTrigger.ACCEPTED,
      EmailNotificationTrigger.REJECTED,
    ],
  });

  // testProgramItem runs 14:00-18:00, testProgramItem2 starts 15:00 inside it,
  // so winning the first must remove the overlapping lottery sign-up to the second
  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
    { ...testProgramItem2, minAttendance: 1, maxAttendance: 1 },
  ]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [
      { ...mockLotterySignups[0], priority: 1 },
      { ...mockLotterySignups[1], priority: 1 },
    ],
  });

  const assignResultsResult = await runAssignment({
    assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
    assignmentTime: testProgramItem.startTime,
  });

  // The seats are already saved when notifications are queued, so a queue
  // failure must not fail the run: a failure result would skip the overlap
  // cleanup below and report a run that in fact placed people
  expect(assignResultsResult.ok).toBe(true);
  const assignResults = unsafelyUnwrap(assignResultsResult);
  expect(assignResults.status).toEqual(AssignmentResultStatus.SUCCESS);
  expect(assignResults.results).toHaveLength(1);
  expect(assignResults.results[0].assignmentSignup.programItemId).toEqual(
    testProgramItem.programItemId,
  );

  // The won seat is persisted
  const signupsAfterRun = unsafelyUnwrap(await findDirectSignups());
  const wonSignup = signupsAfterRun.find(
    (signup) => signup.programItemId === testProgramItem.programItemId,
  );
  expect(wonSignup?.userSignups).toHaveLength(1);
  expect(wonSignup?.userSignups[0].username).toEqual(mockUser.username);

  // The overlapping lottery sign-up was removed despite the queue failure
  const userAfterRun = unsafelyUnwrap(await findUser(mockUser.username));
  expect(
    userAfterRun?.lotterySignups.map((signup) => signup.programItemId),
  ).toEqual([testProgramItem.programItemId]);
});

test("Should not fail assignment or skip overlap cleanup when event log writes fail", async () => {
  // Event log writes fail for the whole run
  vi.mocked(addEventLogItems).mockResolvedValue(
    makeErrorResult(MongoDbError.UNKNOWN_ERROR),
  );

  // Pin a single queue instance so queued emails can be asserted after the run
  const queueService = createNotificationQueueService(
    new EmailSender(),
    1,
    true,
  );
  vi.mocked(getGlobalNotificationQueueService).mockReturnValue(queueService);

  await saveSettings({
    emailNotificationTrigger: [
      EmailNotificationTrigger.ACCEPTED,
      EmailNotificationTrigger.REJECTED,
    ],
  });

  // testProgramItem runs 14:00-18:00, testProgramItem2 starts 15:00 inside it,
  // so winning the first must remove the overlapping lottery sign-up to the second
  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
    { ...testProgramItem2, minAttendance: 1, maxAttendance: 1 },
    // Stays under min attendance with its single attendee, so the second user
    // deterministically loses the lottery
    {
      ...testProgramItem,
      programItemId: "under-min-attendance-item",
      parentId: "under-min-attendance-item",
      title: "Under min attendance item",
      minAttendance: 2,
      maxAttendance: 2,
    },
  ]);
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [
      { ...mockLotterySignups[0], priority: 1 },
      { ...mockLotterySignups[1], priority: 1 },
    ],
  });
  await saveLotterySignups({
    username: mockUser2.username,
    lotterySignups: [
      {
        programItemId: "under-min-attendance-item",
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    ],
  });

  const assignResultsResult = await runAssignment({
    assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
    assignmentTime: testProgramItem.startTime,
  });

  // The seats are already saved when the event logs are written, so an event
  // log failure must not fail the run or skip the overlap cleanup below
  expect(assignResultsResult.ok).toBe(true);
  const assignResults = unsafelyUnwrap(assignResultsResult);
  expect(assignResults.status).toEqual(AssignmentResultStatus.SUCCESS);
  expect(assignResults.results).toHaveLength(1);
  expect(assignResults.results[0].username).toEqual(mockUser.username);
  expect(assignResults.results[0].assignmentSignup.programItemId).toEqual(
    testProgramItem.programItemId,
  );

  // The won seat is persisted
  const signupsAfterRun = unsafelyUnwrap(await findDirectSignups());
  const wonSignup = signupsAfterRun.find(
    (signup) => signup.programItemId === testProgramItem.programItemId,
  );
  expect(wonSignup?.userSignups).toHaveLength(1);
  expect(wonSignup?.userSignups[0].username).toEqual(mockUser.username);

  // The overlapping lottery sign-up was removed despite the event log failures
  const userAfterRun = unsafelyUnwrap(await findUser(mockUser.username));
  expect(
    userAfterRun?.lotterySignups.map((signup) => signup.programItemId),
  ).toEqual([testProgramItem.programItemId]);

  // Event log failures don't skip email queueing: the winner's accepted email
  // and the loser's rejected email are both queued
  const queuedNotifications = queueService.getItems();
  const acceptedNotifications = queuedNotifications.filter(
    (task) => task.type === NotificationTaskType.SEND_EMAIL_ACCEPTED,
  );
  const rejectedNotifications = queuedNotifications.filter(
    (task) => task.type === NotificationTaskType.SEND_EMAIL_REJECTED,
  );
  expect(acceptedNotifications).toHaveLength(1);
  expect(acceptedNotifications[0].username).toEqual(mockUser.username);
  expect(rejectedNotifications).toHaveLength(1);
  expect(rejectedNotifications[0].username).toEqual(mockUser2.username);
});

test("Should not fail assignment or skip overlap cleanup when email queueing fails", async () => {
  // Email notifications are enabled but pushing to the queue fails
  const queueService = createNotificationQueueService(
    new EmailSender(),
    1,
    true,
  );
  const addNotificationsBulkSpy = vi
    .spyOn(queueService, "addNotificationsBulk")
    .mockReturnValue(makeErrorResult(QueueError.FAILED_TO_PUSH));
  vi.mocked(getGlobalNotificationQueueService).mockReturnValue(queueService);

  await saveSettings({
    emailNotificationTrigger: [
      EmailNotificationTrigger.ACCEPTED,
      EmailNotificationTrigger.REJECTED,
    ],
  });

  // testProgramItem runs 14:00-18:00, testProgramItem2 starts 15:00 inside it,
  // so winning the first must remove the overlapping lottery sign-up to the second
  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
    { ...testProgramItem2, minAttendance: 1, maxAttendance: 1 },
  ]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [
      { ...mockLotterySignups[0], priority: 1 },
      { ...mockLotterySignups[1], priority: 1 },
    ],
  });

  const assignResultsResult = await runAssignment({
    assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
    assignmentTime: testProgramItem.startTime,
  });

  // The seats are already saved when emails are queued, so a push failure must
  // not fail the run or skip the overlap cleanup below
  expect(assignResultsResult.ok).toBe(true);
  const assignResults = unsafelyUnwrap(assignResultsResult);
  expect(assignResults.status).toEqual(AssignmentResultStatus.SUCCESS);
  expect(assignResults.results).toHaveLength(1);

  // The failing push was actually attempted, so the run survived it rather
  // than skipping email queueing
  expect(addNotificationsBulkSpy).toHaveBeenCalled();

  // The won seat is persisted
  const signupsAfterRun = unsafelyUnwrap(await findDirectSignups());
  const wonSignup = signupsAfterRun.find(
    (signup) => signup.programItemId === testProgramItem.programItemId,
  );
  expect(wonSignup?.userSignups).toHaveLength(1);
  expect(wonSignup?.userSignups[0].username).toEqual(mockUser.username);

  // The overlapping lottery sign-up was removed despite the queueing failure
  const userAfterRun = unsafelyUnwrap(await findUser(mockUser.username));
  expect(
    userAfterRun?.lotterySignups.map((signup) => signup.programItemId),
  ).toEqual([testProgramItem.programItemId]);
});

test("Should mark a batched program item with its own start time, not the parent's", async () => {
  // A batch is lotteried as one run at the parent's time, which is the same before and after a
  // program item moves - so only its own start time can record where it was lotteried
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

  unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm: AssignmentAlgorithm.RANDOM,
      assignmentTime: parentStartTime,
    }),
  );

  const programItem = unsafelyUnwrap(
    await findProgramItemById(testProgramItem.programItemId),
  );
  expect(programItem.lotteryRanForStartTime).toEqual(testProgramItem.startTime);
  // It has not moved, so nothing should read it as lotteried somewhere else
  expect(hasLotteryAlreadyRun(programItem)).toEqual(false);
});

test("Should keep the lottery sign-ups of a program item added to a lotteried start time", async () => {
  // The start time has been decided, so these sign-ups record a lottery that is over rather
  // than one still to come, and nothing removes them
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
  });

  await saveProgramItems([{ ...testProgramItem, maxAttendance: 1 }]);
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm: AssignmentAlgorithm.RANDOM,
      assignmentTime: testProgramItem.startTime,
    }),
  );

  // A program item arrives on the same starting time afterwards and takes a lottery sign-up
  const addedProgramItem = {
    ...testProgramItem2,
    startTime: testProgramItem.startTime,
    programType: testProgramItem.programType,
  };
  await saveProgramItems([
    { ...testProgramItem, maxAttendance: 1 },
    addedProgramItem,
  ]);
  await saveLotterySignups({
    username: mockUser2.username,
    lotterySignups: [
      {
        programItemId: addedProgramItem.programItemId,
        priority: 1,
        signedToStartTime: addedProgramItem.startTime,
      },
    ],
  });

  const secondRun = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm: AssignmentAlgorithm.RANDOM,
      assignmentTime: testProgramItem.startTime,
    }),
  );
  expect(secondRun.status).toEqual(AssignmentResultStatus.ALREADY_LOTTERIED);

  const secondUser = unsafelyUnwrap(await findUser(mockUser2.username));

  expect(secondUser?.lotterySignups).toEqual([
    expect.objectContaining({
      programItemId: addedProgramItem.programItemId,
    }),
  ]);
  expect(
    secondUser?.eventLogItems.map((eventLogItem) => eventLogItem.action),
  ).not.toContain(EventLogAction.PROGRAM_ITEM_NO_LOTTERY_ANYMORE);
});
