import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import dayjs from "dayjs";
import { faker } from "@faker-js/faker";
import { assertUserUpdatedCorrectly } from "server/features/assignment/runAssignmentTestUtils";
import { runAssignment } from "server/features/assignment/runAssignment";
import { generateTestData } from "server/test/test-data-generation/generators/generateTestData";
import { AssignmentStrategy } from "shared/config/eventConfigTypes";
import { config } from "shared/config";
import { AssignmentResultStatus } from "server/types/resultTypes";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { testProgramItem } from "shared/tests/testProgramItem";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { saveUser } from "server/features/user/userRepository";
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

// This needs to be adjusted if test data is changed
const expectedResultsCount = 20;
const groupTestUsers = ["group1", "group2", "group3"];

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("Assignment with valid data should return success with padg strategy", async () => {
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

  const { conventionStartTime } = config.event();
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

  const assignResults2 = unsafelyUnwrap(
    await runAssignment({
      assignmentStrategy,
      startTime,
    }),
  );

  expect(assignResults2.status).toEqual("success");
  expect(assignResults2.results.length).toBeGreaterThanOrEqual(
    expectedResultsCount,
  );

  const groupResults2 = assignResults2.results.filter((result) =>
    groupTestUsers.includes(result.username),
  );

  if (groupResults2.length) {
    expect(groupResults2.length).toEqual(groupTestUsers.length);
  } else {
    expect(groupResults2.length).toEqual(0);
  }

  const updatedUsers2 = assignResults2.results.map((result) => result.username);
  await assertUserUpdatedCorrectly(updatedUsers2);
});

test("Should adjust attendee limits if there are previous signups from moved program items", async () => {
  const assignmentStrategy = AssignmentStrategy.PADG;

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
    startTime: dayjs(testProgramItem.startTime)
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

  expect(assignmentSignup?.userSignups).toMatchObject([
    {
      username: mockUser.username,
      time: dayjs(testProgramItem.startTime).subtract(1, "hours").toISOString(),
      message: "",
      priority: 0,
    },
    {
      username: mockUser3.username,
      time: mockLotterySignups[0].programItem.startTime,
      message: "",
      priority: 1,
    },
  ]);
});

test("Assignment with no program items should return error with padg strategy", async () => {
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

  const { conventionStartTime } = config.event();
  const assignmentStrategy = AssignmentStrategy.PADG;
  const startTime = dayjs(conventionStartTime).add(2, "hours").toISOString();

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentStrategy,
      startTime,
    }),
  );

  expect(assignResults.status).toEqual(
    AssignmentResultStatus.NO_STARTING_PROGRAM_ITEMS,
  );
});

test("Assignment with no attendees should return error with padg strategy", async () => {
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

  const { conventionStartTime } = config.event();
  const assignmentStrategy = AssignmentStrategy.PADG;
  const startTime = dayjs(conventionStartTime).add(2, "hours").toISOString();

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentStrategy,
      startTime,
    }),
  );

  expect(assignResults.status).toEqual(
    AssignmentResultStatus.NO_LOTTERY_SIGNUPS,
  );
});
