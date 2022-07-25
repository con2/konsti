import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dayjs from "dayjs";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { generateTestData } from "server/test/test-data-generation/generators/generateTestData";
import { verifyUserSignups } from "server/features/player-assignment/utils/verifyUserSignups";
import { verifyResults } from "server/features/player-assignment/utils/verifyResults";
import { AssignmentStrategy } from "shared/config/sharedConfig.types";
import { sharedConfig } from "shared/config/sharedConfig";

let mongoServer: MongoMemoryServer;

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  await mongoServer.start();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Assignment with valid data", () => {
  beforeEach(async () => {
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
  });

  test("should return success with group strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.GROUP;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    // FIRST RUN

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toBeGreaterThanOrEqual(25);

    await verifyUserSignups();
    await verifyResults();

    // SECOND RUN

    const assignResults2 = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults2.status).toEqual("success");
    expect(assignResults2.results.length).toBeGreaterThanOrEqual(25);

    await verifyUserSignups();
    await verifyResults();
  });

  test("should return success with padg strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.PADG;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    // FIRST RUN

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toBeGreaterThanOrEqual(25);

    await verifyUserSignups();
    await verifyResults();

    // SECOND RUN

    const assignResults2 = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults2.status).toEqual("success");
    expect(assignResults2.results.length).toBeGreaterThanOrEqual(25);

    await verifyUserSignups();
    await verifyResults();
  });

  test("should return success with random strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.RANDOM;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    // FIRST RUN

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toBeGreaterThanOrEqual(25);

    await verifyUserSignups();
    await verifyResults();

    // SECOND RUN

    const assignResults2 = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults2.status).toEqual("success");
    expect(assignResults2.results.length).toBeGreaterThanOrEqual(25);

    await verifyUserSignups();
    await verifyResults();
  });

  test("should return success with group+padg strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.GROUP_PADG;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    // FIRST RUN

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toBeGreaterThanOrEqual(25);

    await verifyUserSignups();
    await verifyResults();

    // SECOND RUN

    const assignResults2 = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults2.status).toEqual("success");
    expect(assignResults2.results.length).toBeGreaterThanOrEqual(25);

    await verifyUserSignups();
    await verifyResults();
  });

  test("should return success with random+padg strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    // FIRST RUN

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toBeGreaterThanOrEqual(25);

    await verifyUserSignups();
    await verifyResults();

    // SECOND RUN

    const assignResults2 = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults2.status).toEqual("success");
    expect(assignResults2.results.length).toBeGreaterThanOrEqual(25);

    await verifyUserSignups();
    await verifyResults();
  });

  test("should return valid results after multiple executions on different times", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.PADG;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    // FIRST RUN

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toBeGreaterThanOrEqual(25);

    await verifyUserSignups();
    await verifyResults();

    // SECOND RUN

    const startingTime2 = dayjs(CONVENTION_START_TIME).add(3, "hours").format();

    const assignResults2 = await runAssignment({
      assignmentStrategy,
      startingTime: startingTime2,
    });
    expect(assignResults2.status).toEqual("success");
    // Second assignment has less available players -> less results
    // Disabled because can return 0
    // expect(assignResults2.results.length).toBeGreaterThanOrEqual(3);

    await verifyUserSignups();
    await verifyResults();
  });
});

describe("Assignment with no games", () => {
  beforeEach(async () => {
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
  });

  test("should return error with group strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.GROUP;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("error: no starting games");
  });

  test("should return error with padg strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.PADG;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("error: no starting games");
  });

  test("should return error with random strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.RANDOM;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("error: no starting games");
  });

  test("should return error with group+padg strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.GROUP_PADG;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("error: no starting games");
  });

  test("should return error with random+padg strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("error: no starting games");
  });
});

describe("Assignment with no players", () => {
  beforeEach(async () => {
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
  });

  test("should return error with group strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.GROUP;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("error: no signup wishes");
  });

  test("should return error with padg strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.PADG;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("error: no signup wishes");
  });

  test("should return error with random strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.RANDOM;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("error: no signup wishes");
  });

  test("should return error with group+padg strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.GROUP_PADG;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("error: no signup wishes");
  });

  test("should return error with random+padg strategy", async () => {
    const { CONVENTION_START_TIME } = sharedConfig;
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
    const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("error: no signup wishes");
  });
});
