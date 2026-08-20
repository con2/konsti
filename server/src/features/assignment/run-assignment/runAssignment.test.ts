import { faker } from "@faker-js/faker";
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
import { ProgramType } from "shared/types/models/programItem";
import { makeErrorResult } from "shared/utils/result";
import { db } from "server/db/mongodb";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import {
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
import { ProgramItemModel } from "server/features/program-item/programItemSchema";
import { findResults } from "server/features/results/resultsRepository";
import { saveSettings } from "server/features/settings/settingsRepository";
import {
  addEventLogItems,
  deleteEventLogItemsByStartTime,
} from "server/features/user/event-log/eventLogRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockLotterySignups,
  mockPostDirectSignupRequest,
  mockPostDirectSignupRequest2,
  mockUser,
  mockUser2,
} from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { AssignmentResultStatus } from "server/types/resultTypes";
import {
  NotificationTaskType,
  createNotificationQueueService,
  getGlobalNotificationQueueService,
} from "server/utils/notificationQueue";

// This needs to be adjusted if test data is changed
const expectedResultsCount = 18;
const groupTestUsers = new Set(["group1", "group2", "group3"]);

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

// Pass-through wrappers so single tests can override the event log writes
// with an error result; vi.resetAllMocks restores the real implementations
vi.mock(
  import("server/features/user/event-log/eventLogRepository"),
  async (originalImport) => {
    const actual = await originalImport();
    return {
      ...actual,
      addEventLogItems: vi.fn(actual.addEventLogItems),
      deleteEventLogItemsByStartTime: vi.fn(
        actual.deleteEventLogItemsByStartTime,
      ),
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
  await db.connectToDb(globalThis.__MONGO_URI__, faker.string.alphanumeric(10));
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
    expect(assignResults.results.length).toBeGreaterThanOrEqual(
      expectedResultsCount,
    );

    const groupResults = assignResults.results.filter((result) =>
      groupTestUsers.has(result.username),
    );

    if (groupResults.length > 0) {
      // eslint-disable-next-line vitest/no-conditional-expect
      expect(groupResults.length).toEqual(groupTestUsers.size);
    } else {
      // eslint-disable-next-line vitest/no-conditional-expect
      expect(groupResults.length).toEqual(0);
    }

    const updatedUsers = assignResults.results.map((result) => result.username);
    await assertUserUpdatedCorrectly(updatedUsers);

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

    expect(assignResults2.results.length).toBeGreaterThan(0);

    const groupResults2 = assignResults2.results.filter((result) =>
      groupTestUsers.has(result.username),
    );

    if (groupResults2.length > 0) {
      // eslint-disable-next-line vitest/no-conditional-expect
      expect(groupResults2.length).toEqual(groupTestUsers.size);
    } else {
      // eslint-disable-next-line vitest/no-conditional-expect
      expect(groupResults2.length).toEqual(0);
    }

    const updatedUsers2 = assignResults2.results.map(
      (result) => result.username,
    );
    await assertUserUpdatedCorrectly(updatedUsers2);
  });
});

describe("Assignment with multiple program types and directSignupAlwaysOpen", () => {
  test("should update previous non-lottery signup if user has updated result", async () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
    });

    // ProgramItem1: 14:00 direct sign-up LARP
    // ProgramItem2: 14:00 lottery sign-up TABLETOP_RPG -> replaces ProgramItem1
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

    // User has previous direct LARP sign-up - this should be replaced by assignment result
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
    expect(assignResults.results[0].assignmentSignup.programItemId).toEqual(
      testProgramItem2.programItemId,
    );

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

  test("should update 'directSignupAlwaysOpen' signup with assignment signup if user has updated result", async () => {
    const directSignupAlwaysOpenId = "1234";
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      directSignupAlwaysOpenIds: [directSignupAlwaysOpenId],
    });

    const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

    await saveProgramItems([
      testProgramItem,
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

    // This should be removed and re-added by assignment
    await saveDirectSignup(mockPostDirectSignupRequest);
    // This should be replaced by assignment
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
    expect(assignResults.results.length).toEqual(2);
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

  test("should update previous signup from moved program item with assignment signup if user has updated result", async () => {
    // ProgramItem1: 14:00 direct sign-up -> program item moved 15:00
    // ProgramItem2: 15:00 lottery sign-up -> replaces ProgramItem1
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

    // User has previous sign-up from moved program item - this should be replaced by assignment result
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
    assignResults.results.map((result) => {
      expect(result.assignmentSignup.programItemId).toEqual(
        testProgramItem2.programItemId,
      );
    });

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

    const previousSignupFromMovedProgramItem = signupsAfterUpdate.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(previousSignupFromMovedProgramItem?.userSignups).toHaveLength(0);

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

test("Assignment with no program items should return error", async () => {
  const newUsersCount = 1;
  const groupSize = 0;
  const numberOfGroups = 0;
  const newProgramItemsCount = 0;
  const testUsersCount = 0;

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

test("Should keep a past lottery signup but not let it affect an upcoming lottery", async () => {
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
  // cleanup below and invite a re-run that reshuffles the saved seats
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
  vi.mocked(deleteEventLogItemsByStartTime).mockResolvedValue(
    makeErrorResult(MongoDbError.UNKNOWN_ERROR),
  );
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
