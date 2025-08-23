import { expect, test, afterEach, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import dayjs from "dayjs";
import { faker } from "@faker-js/faker";
import {
  assertUserUpdatedCorrectly,
  firstLotterySignupSlot,
  generateTestData,
} from "server/features/assignment/run-assignment/runAssignmentTestUtils";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { config } from "shared/config";
import { AssignmentResultStatus } from "server/types/resultTypes";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { testProgramItem } from "shared/tests/testProgramItem";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import {
  mockPostDirectSignupRequest,
  mockLotterySignups,
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
} from "server/test/mock-data/mockUser";
import {
  findDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import {
  createNotificationQueueService,
  getGlobalNotificationQueueService,
} from "server/utils/notificationQueue";
import { NullSender } from "server/features/notifications/nullSender";
import { ProgramType } from "shared/types/models/programItem";
import { EventLogAction } from "shared/types/models/eventLog";

// This needs to be adjusted if test data is changed
const expectedResultsCount = 20;
const groupTestUsers = ["group1", "group2", "group3"];

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
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
  vi.mocked(getGlobalNotificationQueueService).mockReturnValue(
    createNotificationQueueService(new NullSender(), 2, true),
  );
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("Assignment with valid data should return success with padg algorithm", async () => {
  const newUsersCount = 20;
  const groupSize = 3;
  const numberOfGroups = 5;
  const newProgramItemsCount = 10;
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
  const assignmentTime = dayjs(eventStartTime)
    .add(firstLotterySignupSlot, "hours")
    .toISOString();

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
    groupTestUsers.includes(result.username),
  );

  if (groupResults.length > 0) {
    expect(groupResults.length).toEqual(groupTestUsers.length);
  } else {
    expect(groupResults.length).toEqual(0);
  }

  const updatedUsers = assignResults.results.map((result) => result.username);
  await assertUserUpdatedCorrectly(updatedUsers);

  // SECOND RUN

  const assignResults2 = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm,
      assignmentTime,
    }),
  );

  expect(assignResults2.status).toEqual("success");
  expect(assignResults2.results.length).toBeGreaterThanOrEqual(
    expectedResultsCount,
  );

  const groupResults2 = assignResults2.results.filter((result) =>
    groupTestUsers.includes(result.username),
  );

  if (groupResults2.length > 0) {
    expect(groupResults2.length).toEqual(groupTestUsers.length);
  } else {
    expect(groupResults2.length).toEqual(0);
  }

  const updatedUsers2 = assignResults2.results.map((result) => result.username);
  await assertUserUpdatedCorrectly(updatedUsers2);
});

test("Should adjust attendee limits if there are previous signups from moved program items", async () => {
  const assignmentAlgorithm = AssignmentAlgorithm.PADG;

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 2, maxAttendance: 2 },
  ]);
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveUser(mockUser3);
  await saveUser(mockUser4);

  // ** Save previous signups

  // This should remain because of different startTime
  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    signedToStartTime: dayjs(testProgramItem.startTime)
      .subtract(1, "hours")
      .toISOString(),
  });

  // This should be removed becase of same startTime
  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    username: mockUser2.username,
  });

  // ** Save selected program items

  // This will get assigned
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
      signedToStartTime: dayjs(testProgramItem.startTime)
        .subtract(1, "hours")
        .toISOString(),
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

test("Assignment with no attendees should return error with padg algorithm", async () => {
  const newUsersCount = 0;
  const groupSize = 0;
  const numberOfGroups = 0;
  const newProgramItemsCount = 1;
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
  const assignmentTime = dayjs(eventStartTime).add(2, "hours").toISOString();

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
  const parentStartTime = dayjs(testProgramItem.startTime)
    .add(30, "minutes")
    .toISOString();

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

  const assignmentAlgorithm = AssignmentAlgorithm.PADG;

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
  const parentStartTime = dayjs(testProgramItem.startTime)
    .add(30, "minutes")
    .toISOString();

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

  await saveProgramItems([testProgramItem]);
  await saveUser({ ...mockUser, groupCode, groupCreatorCode: groupCode });
  await saveUser({ ...mockUser2, groupCode });

  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  const assignmentAlgorithm = AssignmentAlgorithm.PADG;

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

  const user1AfterSave = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user1AfterSave?.eventLogItems).toHaveLength(1);
  expect(user1AfterSave?.eventLogItems[0].action).toEqual(
    EventLogAction.NEW_ASSIGNMENT,
  );

  const user2AfterSave = unsafelyUnwrap(await findUser(mockUser2.username));
  expect(user2AfterSave?.eventLogItems).toHaveLength(1);
  expect(user2AfterSave?.eventLogItems[0].action).toEqual(
    EventLogAction.NEW_ASSIGNMENT,
  );
});
