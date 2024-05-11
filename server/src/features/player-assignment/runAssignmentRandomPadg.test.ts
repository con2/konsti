import { expect, test, afterEach, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import dayjs from "dayjs";
import { faker } from "@faker-js/faker";
import { assertUserUpdatedCorrectly } from "server/features/player-assignment/runAssignmentTestUtils";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { generateTestData } from "server/test/test-data-generation/generators/generateTestData";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";
import { config } from "shared/config";
import { AssignmentResultStatus } from "server/types/resultTypes";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import * as randomAssign from "server/features/player-assignment/random/randomAssignPlayers";
import * as padgAssign from "server/features/player-assignment/padg/padgAssignPlayers";
import { AssignmentError } from "shared/types/api/errors";
import { makeErrorResult } from "shared/utils/result";

// This needs to be adjusted if test data is changed
const expectedResultsCount = 20;
const groupTestUsers = ["group1", "group2", "group3"];

const { conventionStartTime } = config.shared();

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("Assignment with valid data should return success with random+padg strategy", async () => {
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

  const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
  const startTime = dayjs(conventionStartTime).add(2, "hours").toISOString();

  // FIRST RUN

  const assignResultsResult = await runAssignment({
    assignmentStrategy,
    startTime,
  });
  const assignResults = unsafelyUnwrapResult(assignResultsResult);

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

  const assignResultsEither2 = await runAssignment({
    assignmentStrategy,
    startTime,
  });
  const assignResults2 = unsafelyUnwrapResult(assignResultsEither2);

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

test("Assignment with no program items should return error with random+padg strategy", async () => {
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

  const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
  const startTime = dayjs(conventionStartTime).add(2, "hours").toISOString();

  const assignResultsResult = await runAssignment({
    assignmentStrategy,
    startTime,
  });
  const assignResults = unsafelyUnwrapResult(assignResultsResult);

  expect(assignResults.status).toEqual(
    AssignmentResultStatus.NO_STARTING_PROGRAM_ITEMS,
  );
});

test("Assignment with no players should return error with random+padg strategy", async () => {
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

  const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
  const startTime = dayjs(conventionStartTime).add(2, "hours").toISOString();

  const assignResultsResult = await runAssignment({
    assignmentStrategy,
    startTime,
  });
  const assignResults = unsafelyUnwrapResult(assignResultsResult);

  expect(assignResults.status).toEqual(AssignmentResultStatus.NO_SIGNUP_WISHES);
});

test("If random assignment fails, should return PADG result", async () => {
  vi.spyOn(randomAssign, "randomAssignPlayers").mockReturnValueOnce(
    makeErrorResult(AssignmentError.UNKNOWN_ERROR),
  );

  const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
  const startTime = dayjs(conventionStartTime).toISOString();

  const assignResultsResult = await runAssignment({
    assignmentStrategy,
    startTime,
  });

  const assignResults = unsafelyUnwrapResult(assignResultsResult);
  expect(assignResults.algorithm).toEqual(AssignmentStrategy.PADG);
  expect(assignResults.status).toEqual(
    AssignmentResultStatus.NO_STARTING_PROGRAM_ITEMS,
  );
});

test("If PADG assignment fails, should return random result", async () => {
  vi.spyOn(padgAssign, "padgAssignPlayers").mockReturnValueOnce(
    makeErrorResult(AssignmentError.UNKNOWN_ERROR),
  );

  const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
  const startTime = dayjs(conventionStartTime).toISOString();

  const assignResultsResult = await runAssignment({
    assignmentStrategy,
    startTime,
  });

  const assignResults = unsafelyUnwrapResult(assignResultsResult);
  expect(assignResults.algorithm).toEqual(AssignmentStrategy.RANDOM);
  expect(assignResults.status).toEqual(
    AssignmentResultStatus.NO_STARTING_PROGRAM_ITEMS,
  );
});

test("If both assignments fail, should return error result", async () => {
  vi.spyOn(randomAssign, "randomAssignPlayers").mockReturnValueOnce(
    makeErrorResult(AssignmentError.UNKNOWN_ERROR),
  );
  vi.spyOn(padgAssign, "padgAssignPlayers").mockReturnValueOnce(
    makeErrorResult(AssignmentError.UNKNOWN_ERROR),
  );

  const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
  const startTime = dayjs(conventionStartTime).toISOString();

  const assignResultsResult = await runAssignment({
    assignmentStrategy,
    startTime,
  });

  expect(assignResultsResult.error).toEqual(AssignmentError.UNKNOWN_ERROR);
});
