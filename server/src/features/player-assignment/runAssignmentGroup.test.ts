import {
  expect,
  test,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
} from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dayjs from "dayjs";
import { faker } from "@faker-js/faker";
import { assertUserUpdatedCorrectly } from "server/features/player-assignment/runAssignmentTestUtils";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { generateTestData } from "server/test/test-data-generation/generators/generateTestData";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";
import { getSharedConfig } from "shared/config/sharedConfig";
import { AssignmentResultStatus } from "server/typings/result.typings";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";

let mongoServer: MongoMemoryServer;

// This needs to be adjusted if test data is changed
const expectedResultsCount = 18;
const groupTestUsers = ["group1", "group2", "group3"];

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  await mongoose.connect(mongoServer.getUri(), {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

afterAll(async () => {
  await mongoServer.stop();
});

test("Assignment with valid data should return success with group strategy", async () => {
  const newUsersCount = 20;
  const groupSize = 3;
  const numberOfGroups = 5;
  const newGamesCount = 10;
  const testUsersCount = 0;

  await generateTestData(
    newUsersCount,
    newGamesCount,
    groupSize,
    numberOfGroups,
    testUsersCount,
  );

  const { CONVENTION_START_TIME } = getSharedConfig();
  const assignmentStrategy = AssignmentStrategy.GROUP;
  const startTime = dayjs(CONVENTION_START_TIME).add(2, "hours").toISOString();

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

test("Assignment with no games should return error with group strategy", async () => {
  const newUsersCount = 1;
  const groupSize = 0;
  const numberOfGroups = 0;
  const newGamesCount = 0;
  const testUsersCount = 0;

  await generateTestData(
    newUsersCount,
    newGamesCount,
    groupSize,
    numberOfGroups,
    testUsersCount,
  );

  const { CONVENTION_START_TIME } = getSharedConfig();
  const assignmentStrategy = AssignmentStrategy.GROUP;
  const startTime = dayjs(CONVENTION_START_TIME).add(2, "hours").toISOString();

  const assignResultsResult = await runAssignment({
    assignmentStrategy,
    startTime,
  });
  const assignResults = unsafelyUnwrapResult(assignResultsResult);

  expect(assignResults.status).toEqual(
    AssignmentResultStatus.NO_STARTING_GAMES,
  );
});

test("Assignment with no players should return error with group strategy", async () => {
  const newUsersCount = 0;
  const groupSize = 0;
  const numberOfGroups = 0;
  const newGamesCount = 1;
  const testUsersCount = 0;

  await generateTestData(
    newUsersCount,
    newGamesCount,
    groupSize,
    numberOfGroups,
    testUsersCount,
  );

  const { CONVENTION_START_TIME } = getSharedConfig();
  const assignmentStrategy = AssignmentStrategy.GROUP;
  const startTime = dayjs(CONVENTION_START_TIME).add(2, "hours").toISOString();

  const assignResultsResult = await runAssignment({
    assignmentStrategy,
    startTime,
  });
  const assignResults = unsafelyUnwrapResult(assignResultsResult);

  expect(assignResults.status).toEqual(AssignmentResultStatus.NO_SIGNUP_WISHES);
});
