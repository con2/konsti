import { expect, test, afterEach, beforeEach, describe, vi } from "vitest";
import mongoose from "mongoose";
import dayjs from "dayjs";
import { faker } from "@faker-js/faker";
import { runAssignment } from "server/features/assignment/runAssignment";
import { generateTestData } from "server/test/test-data-generation/generators/generateTestData";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";
import { config } from "shared/config";
import { saveUser } from "server/features/user/userRepository";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import {
  findDirectSignups,
  findUserDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import {
  mockPostDirectSignupRequest,
  mockPostDirectSignupRequest2,
  mockLotterySignups,
  mockUser,
  mockUser2,
} from "server/test/mock-data/mockUser";
import { ProgramType } from "shared/types/models/programItem";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { assertUserUpdatedCorrectly } from "server/features/assignment/runAssignmentTestUtils";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { ProgramItemModel } from "server/features/program-item/programItemSchema";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import { EventLogAction } from "shared/types/models/eventLog";

// This needs to be adjusted if test data is changed
const expectedResultsCount = 18;
const groupTestUsers = ["group1", "group2", "group3"];

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
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
    const { conventionStartTime } = config.shared();
    const assignmentStrategy = AssignmentStrategy.PADG;
    const startTime = dayjs(conventionStartTime).add(2, "hours").toISOString();

    // FIRST RUN

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentStrategy,
        startTime,
      }),
    );

    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toBeGreaterThanOrEqual(
      expectedResultsCount,
    );

    const groupResults = assignResults.results.filter((result) =>
      groupTestUsers.includes(result.username),
    );

    if (groupResults.length) {
      expect(groupResults.length).toEqual(groupTestUsers.length);
    } else {
      expect(groupResults.length).toEqual(0);
    }

    const updatedUsers = assignResults.results.map((result) => result.username);
    await assertUserUpdatedCorrectly(updatedUsers);

    // SECOND RUN

    const startTime2 = dayjs(conventionStartTime).add(3, "hours").toISOString();

    const assignResults2Result = await runAssignment({
      assignmentStrategy,
      startTime: startTime2,
    });
    expect(assignResults2Result.error).toBeUndefined();
    const assignResults2 = unsafelyUnwrap(assignResults2Result);

    // Second assignment has less available attendees -> less results
    expect(assignResults2.results.length).toBeGreaterThanOrEqual(
      expectedResultsCount - assignResults.results.length,
    );

    const groupResults2 = assignResults2.results.filter((result) =>
      groupTestUsers.includes(result.username),
    );

    if (groupResults2.length) {
      expect(groupResults2.length).toEqual(groupTestUsers.length);
    } else {
      expect(groupResults2.length).toEqual(0);
    }

    const updatedUsers2 = assignResults2.results.map(
      (result) => result.username,
    );
    await assertUserUpdatedCorrectly(updatedUsers2);
  });
});

describe("Assignment with multiple program types and directSignupAlwaysOpen", () => {
  test("should not remove signups of non-'twoPhaseSignupProgramTypes' program types", async () => {
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;

    // Populate database
    await saveProgramItems([
      testProgramItem,
      {
        ...testProgramItem2,
        startTime: testProgramItem.startTime,
        programType: ProgramType.TOURNAMENT,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        { ...mockLotterySignups[0], priority: 2 },
        {
          // non-"twoPhaseSignupProgramTypes" signed program item should be ignored
          programItem: {
            ...testProgramItem2,
            programType: ProgramType.TOURNAMENT,
          },
          priority: 1,
          time: testProgramItem.startTime,
          message: "",
        },
      ],
    });
    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [
        { ...mockLotterySignups[0], priority: 2 },
        {
          // non-"twoPhaseSignupProgramTypes" signed program item should be ignored
          programItem: {
            ...testProgramItem2,
            programType: ProgramType.TOURNAMENT,
          },
          priority: 1,
          time: testProgramItem.startTime,
          message: "",
        },
      ],
    });

    // This should not be removed
    await saveDirectSignup({
      ...mockPostDirectSignupRequest2,
      startTime: testProgramItem.startTime,
    });

    const signupsBeforeUpdate = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(signupsBeforeUpdate.length).toEqual(1);

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentStrategy,
        startTime: testProgramItem.startTime,
      }),
    );

    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(2);

    const signupsAfterUpdate = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );

    const tournamentSignup = signupsAfterUpdate.find(
      (signup) => signup.programItem.programType === ProgramType.TOURNAMENT,
    );
    const rpgSignup = signupsAfterUpdate.find(
      (signup) => signup.programItem.programType === ProgramType.TABLETOP_RPG,
    );

    expect(tournamentSignup?.userSignups.length).toEqual(1);
    expect(rpgSignup?.userSignups.length).toEqual(2);
  });

  test("should not remove directSignupAlwaysOpen signups if user doesn't have updated result", async () => {
    const directSignupAlwaysOpenId =
      config.shared().directSignupAlwaysOpenIds[0];
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;

    // Populate database
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
          programItem: {
            ...testProgramItem2,
            programItemId: directSignupAlwaysOpenId,
          },
          priority: 1,
          time: testProgramItem.startTime,
          message: "",
        },
      ],
    });

    // This should not be removed even if start time is same as assignment time
    await saveDirectSignup({
      ...mockPostDirectSignupRequest2,
      username: mockUser2.username,
      startTime: testProgramItem.startTime,
      directSignupProgramItemId: directSignupAlwaysOpenId,
    });

    const signupsBeforeUpdate = unsafelyUnwrap(await findDirectSignups());

    const programItemsWithSignups = signupsBeforeUpdate.filter(
      (signup) => signup.userSignups.length > 0,
    );
    expect(programItemsWithSignups.length).toEqual(1);

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentStrategy,
        startTime: testProgramItem.startTime,
      }),
    );

    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(1);
    assignResults.results.map((result) => {
      expect(result.directSignup.programItem.programItemId).toEqual(
        testProgramItem.programItemId,
      );
    });

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) =>
        signup.programItem.programItemId === testProgramItem.programItemId,
    );

    const directSignupAlwaysOpenSignup = signupsAfterUpdate.find(
      (signup) => signup.programItem.programItemId === directSignupAlwaysOpenId,
    );

    expect(assignmentSignup?.userSignups.length).toEqual(1);
    expect(directSignupAlwaysOpenSignup?.userSignups.length).toEqual(1);
    expect(directSignupAlwaysOpenSignup?.userSignups[0].username).toEqual(
      mockUser2.username,
    );
  });

  test("should not remove previous signup from moved program item if user doesn't have updated result", async () => {
    // User1, programItem1: 14:00 direct signup -> program item moved 15:00
    // User2, programItem2: 15:00 lottery signup -> doesn't affect user1 signup
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;

    const assignmentTime = dayjs(testProgramItem.startTime)
      .add(1, "hours")
      .toISOString();

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

    // User 1 has previous signup from moved program item - this should not be removed
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
        assignmentStrategy,
        startTime: assignmentTime,
      }),
    );
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results).toHaveLength(1);
    assignResults.results.map((result) => {
      expect(result.directSignup.programItem.programItemId).toEqual(
        testProgramItem2.programItemId,
      );
    });

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

    const previousSignupFromMovedProgramItem = signupsAfterUpdate.find(
      (signup) =>
        signup.programItem.programItemId === testProgramItem.programItemId,
    );
    expect(previousSignupFromMovedProgramItem?.userSignups).toHaveLength(1);
    expect(previousSignupFromMovedProgramItem?.userSignups[0].username).toEqual(
      mockUser.username,
    );

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) =>
        signup.programItem.programItemId === testProgramItem2.programItemId,
    );
    expect(assignmentSignup?.userSignups).toHaveLength(1);
    expect(assignmentSignup?.userSignups[0].username).toEqual(
      mockUser2.username,
    );
  });

  test("should update directSignupAlwaysOpen signup with assignment signup if user has updated result", async () => {
    const directSignupAlwaysOpenId =
      config.shared().directSignupAlwaysOpenIds[0];
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;

    // Populate database
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
          programItem: {
            ...testProgramItem2,
            programItemId: directSignupAlwaysOpenId,
          },
          priority: 1,
          time: testProgramItem.startTime,
          message: "",
        },
      ],
    });
    await saveLotterySignups({
      username: mockUser2.username,
      lotterySignups: [
        { ...mockLotterySignups[0], priority: 2 },
        {
          // directSignupAlwaysOpen signed program item should be ignored
          programItem: {
            ...testProgramItem2,
            programItemId: directSignupAlwaysOpenId,
          },
          priority: 1,
          time: testProgramItem.startTime,
          message: "",
        },
      ],
    });

    // This should be removed and re-added by assignment
    await saveDirectSignup(mockPostDirectSignupRequest);
    // This should be replaced by assignment
    await saveDirectSignup({
      ...mockPostDirectSignupRequest2,
      startTime: testProgramItem.startTime,
      directSignupProgramItemId: directSignupAlwaysOpenId,
    });

    const signupsBeforeUpdate = unsafelyUnwrap(await findDirectSignups());

    expect(signupsBeforeUpdate.length).toEqual(2);

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentStrategy,
        startTime: testProgramItem.startTime,
      }),
    );

    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(2);
    assignResults.results.map((result) => {
      expect(result.directSignup.programItem.programItemId).toEqual(
        testProgramItem.programItemId,
      );
    });

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) =>
        signup.programItem.programItemId === testProgramItem.programItemId,
    );
    const directSignupAlwaysOpenSignup = signupsAfterUpdate.find(
      (signup) => signup.programItem.programItemId === directSignupAlwaysOpenId,
    );

    expect(assignmentSignup?.userSignups.length).toEqual(2);
    expect(directSignupAlwaysOpenSignup?.userSignups.length).toEqual(0);
  });

  test("should update previous signup from moved program item with assignment signup if user has updated result", async () => {
    // ProgramItem1: 14:00 direct signup -> program item moved 15:00
    // ProgramItem2: 15:00 lottery signup -> replaces ProgramItem1
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;

    const assignmentTime = dayjs(testProgramItem.startTime)
      .add(1, "hours")
      .toISOString();

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

    // User has previous signup from moved program item - this should be replaced by assignment result
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
        assignmentStrategy,
        startTime: assignmentTime,
      }),
    );
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results).toHaveLength(1);
    assignResults.results.map((result) => {
      expect(result.directSignup.programItem.programItemId).toEqual(
        testProgramItem2.programItemId,
      );
    });

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

    const previousSignupFromMovedProgramItem = signupsAfterUpdate.find(
      (signup) =>
        signup.programItem.programItemId === testProgramItem.programItemId,
    );
    expect(previousSignupFromMovedProgramItem?.userSignups).toHaveLength(0);

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) =>
        signup.programItem.programItemId === testProgramItem2.programItemId,
    );
    expect(assignmentSignup?.userSignups).toHaveLength(1);
    expect(assignmentSignup?.userSignups[0].username).toEqual(
      mockUser.username,
    );
  });

  test("should update previous signup of non-lottery program type if user has updated result", async () => {
    vi.spyOn(config, "shared").mockReturnValueOnce({
      ...config.shared(),
      twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
    });

    // ProgramItem1: 14:00 direct signup LARP
    // ProgramItem2: 14:00 lottery signup TABLETOP_RPG -> replaces ProgramItem1
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
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
          time: assignmentTime,
        },
      ],
    });

    // User has previous direct LARP signup - this should be replaced by assignment result
    await saveDirectSignup(mockPostDirectSignupRequest);
    const signupsBeforeUpdate = unsafelyUnwrap(await findDirectSignups());

    const programItemsWithSignups = signupsBeforeUpdate.filter(
      (signup) => signup.userSignups.length > 0,
    );
    expect(programItemsWithSignups).toHaveLength(1);
    expect(programItemsWithSignups[0].programItem.programType).toEqual(
      ProgramType.LARP,
    );

    const assignResults = unsafelyUnwrap(
      await runAssignment({
        assignmentStrategy,
        startTime: assignmentTime,
      }),
    );
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results).toHaveLength(1);
    expect(
      assignResults.results[0].directSignup.programItem.programItemId,
    ).toEqual(testProgramItem2.programItemId);

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

    const previousLarpSignup = signupsAfterUpdate.find(
      (signup) =>
        signup.programItem.programItemId === testProgramItem.programItemId,
    );
    expect(previousLarpSignup?.userSignups).toHaveLength(0);

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) =>
        signup.programItem.programItemId === testProgramItem2.programItemId,
    );
    expect(assignmentSignup?.userSignups).toHaveLength(1);
    expect(assignmentSignup?.userSignups[0].username).toEqual(
      mockUser.username,
    );
  });
});

describe("Assignment with first time bonus", () => {
  test("should assign user without previous 'twoPhaseSignupProgramTypes' signup", async () => {
    const directSignupAlwaysOpenId =
      config.shared().directSignupAlwaysOpenIds[0];
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
    const tournamentProgramItemId = "AIAHHUA";

    // Populate database
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
      startTime: dayjs(testProgramItem.startTime)
        .subtract(1, "hours")
        .toISOString(),
    });

    // Tournament signup should not affect the bonus
    await saveDirectSignup({
      username: mockUser2.username,
      directSignupProgramItemId: tournamentProgramItemId,
      startTime: dayjs(testProgramItem.startTime)
        .subtract(1, "hours")
        .toISOString(),
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });

    // directSignupAlwaysOpen signup should not affect the bonus
    await saveDirectSignup({
      username: mockUser2.username,
      directSignupProgramItemId: directSignupAlwaysOpenId,
      startTime: dayjs(testProgramItem.startTime)
        .subtract(2, "hours")
        .toISOString(),
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
        assignmentStrategy,
        startTime: testProgramItem.startTime,
      }),
    );
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(1);

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) =>
        signup.programItem.programItemId === testProgramItem.programItemId,
    );

    const previousRpgSignup = signupsAfterUpdate.find(
      (signup) =>
        signup.programItem.programItemId === testProgramItem2.programItemId,
    );

    const previousTournamentSignup = signupsAfterUpdate.find(
      (signup) => signup.programItem.programItemId === tournamentProgramItemId,
    );

    const previousDirectSignupAlwaysOpenSignup = signupsAfterUpdate.find(
      (signup) => signup.programItem.programItemId === directSignupAlwaysOpenId,
    );

    expect(assignmentSignup?.userSignups[0]).toMatchObject({
      username: mockUser2.username,
      time: mockLotterySignups[0].programItem.startTime,
      message: "",
      priority: 3,
    });
    expect(previousRpgSignup?.userSignups[0]).toMatchObject({
      username: mockUser.username,
      time: dayjs(testProgramItem.startTime).subtract(1, "hours").toISOString(),
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });
    expect(previousTournamentSignup?.userSignups[0]).toMatchObject({
      username: mockUser2.username,
      time: dayjs(testProgramItem.startTime).subtract(1, "hours").toISOString(),
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });
    expect(previousDirectSignupAlwaysOpenSignup?.userSignups[0]).toMatchObject({
      username: mockUser2.username,
      time: dayjs(testProgramItem.startTime).subtract(2, "hours").toISOString(),
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });
  });

  test("should assign user with previous failed lottery signup", async () => {
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;

    // Populate database
    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
      { ...testProgramItem2, minAttendance: 1, maxAttendance: 1 },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await addEventLogItems({
      updates: [
        {
          username: mockUser2.username,
          programItemId: testProgramItem.programItemId,
          programItemStartTime: testProgramItem.startTime,
          createdAt: dayjs().toISOString(),
        },
      ],
      action: EventLogAction.NO_ASSIGNMENT,
    });

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
        assignmentStrategy,
        startTime: testProgramItem2.startTime,
      }),
    );
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(1);

    const signupsAfterUpdate = unsafelyUnwrap(await findDirectSignups());
    const assignmentSignup = signupsAfterUpdate.find(
      (signup) =>
        signup.programItem.programItemId === testProgramItem2.programItemId,
    );

    expect(assignmentSignup?.programItem.programItemId).toEqual(
      mockLotterySignups[1].programItem.programItemId,
    );
    expect(assignmentSignup?.userSignups[0]).toMatchObject({
      username: mockUser2.username,
      time: mockLotterySignups[1].programItem.startTime,
      message: "",
      priority: 3,
    });
  });
});
