import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dayjs from "dayjs";
import { faker } from "@faker-js/faker";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { generateTestData } from "server/test/test-data-generation/generators/generateTestData";
import { verifyUserSignups } from "server/features/player-assignment/utils/verifyUserSignups";
import { AssignmentStrategy } from "shared/config/sharedConfig.types";
import { sharedConfig } from "shared/config/sharedConfig";

let mongoServer: MongoMemoryServer;

// This needs to be adjusted if test data is changed
const expectedResultsCount = 20;
const groupTestUsers = ["group1", "group2", "group3"];

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  await mongoose.connect(mongoServer.getUri(), {
    dbName: faker.random.alphaNumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

afterAll(async () => {
  await mongoServer.stop();
});

test("Assignment with valid data should return success with random strategy", async () => {
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
    testUsersCount
  );

  const { CONVENTION_START_TIME } = sharedConfig;
  const assignmentStrategy = AssignmentStrategy.RANDOM;
  const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

  // FIRST RUN

  const assignResults = await runAssignment({
    assignmentStrategy,
    startingTime,
  });
  expect(assignResults.status).toEqual("success");
  expect(assignResults.results.length).toBeGreaterThanOrEqual(
    expectedResultsCount
  );

  const groupResults = assignResults.results.filter((result) =>
    groupTestUsers.includes(result.username)
  );
  expect(groupResults.length).toBeOneOf([groupTestUsers.length, 0]);

  await verifyUserSignups();

  // SECOND RUN

  const assignResults2 = await runAssignment({
    assignmentStrategy,
    startingTime,
  });
  expect(assignResults2.status).toEqual("success");
  expect(assignResults2.results.length).toBeGreaterThanOrEqual(
    expectedResultsCount
  );

  const groupResults2 = assignResults2.results.filter((result) =>
    groupTestUsers.includes(result.username)
  );
  expect(groupResults2.length).toBeOneOf([groupTestUsers.length, 0]);

  await verifyUserSignups();
});

test("Assignment with no games should return error with random strategy", async () => {
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
    testUsersCount
  );

  const { CONVENTION_START_TIME } = sharedConfig;
  const assignmentStrategy = AssignmentStrategy.RANDOM;
  const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

  const assignResults = await runAssignment({
    assignmentStrategy,
    startingTime,
  });
  expect(assignResults.status).toEqual("error: no starting games");
});

test("Assignment with no players should return error with random strategy", async () => {
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
    testUsersCount
  );

  const { CONVENTION_START_TIME } = sharedConfig;
  const assignmentStrategy = AssignmentStrategy.RANDOM;
  const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

  const assignResults = await runAssignment({
    assignmentStrategy,
    startingTime,
  });
  expect(assignResults.status).toEqual("error: no signup wishes");
});
