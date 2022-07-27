import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dayjs from "dayjs";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { generateTestData } from "server/test/test-data-generation/generators/generateTestData";
import { verifyUserSignups } from "server/features/player-assignment/utils/verifyUserSignups";
import { AssignmentStrategy } from "shared/config/sharedConfig.types";
import { sharedConfig } from "shared/config/sharedConfig";
import { saveUser } from "server/features/user/userRepository";
import { saveGames } from "server/features/game/gameRepository";
import {
  findSignups,
  findUserSignups,
  saveSignup,
} from "server/features/signup/signupRepository";
import { testGame, testGame2 } from "shared/tests/testGame";
import {
  mockPostEnteredGameRequest,
  mockPostEnteredGameRequest2,
  mockSignedGames,
  mockUser,
  mockUser2,
} from "server/test/mock-data/mockUser";
import { ProgramType } from "shared/typings/models/game";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";

let mongoServer: MongoMemoryServer;

// This needs to be adjusted if test data is changed
const expectedResultsCount = 20;
const groupTestUsers = ["group1", "group2", "group3"];

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
    expect(assignResults.results.length).toBeGreaterThanOrEqual(
      expectedResultsCount
    );

    const groupResults = assignResults.results.filter((result) =>
      groupTestUsers.includes(result.username)
    );
    expect(groupResults.length).toBeOneOf([groupTestUsers.length, 0]);

    await verifyUserSignups();

    // SECOND RUN

    const startingTime2 = dayjs(CONVENTION_START_TIME).add(3, "hours").format();

    const assignResults2 = await runAssignment({
      assignmentStrategy,
      startingTime: startingTime2,
    });
    expect(assignResults2.status).toEqual("success");
    // Second assignment has less available players -> less results
    expect(assignResults2.results.length).toBeGreaterThanOrEqual(
      expectedResultsCount - assignResults.results.length
    );

    const groupResults2 = assignResults2.results.filter((result) =>
      groupTestUsers.includes(result.username)
    );
    expect(groupResults2.length).toBeOneOf([groupTestUsers.length, 0]);

    await verifyUserSignups();
  });
});

describe("Assignment with multiple program types and directSignupAlwaysOpen", () => {
  test("should not remove signups of non-RPG program types", async () => {
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
    const startingTime = testGame.startTime;

    // Populate database
    await saveGames([
      testGame,
      {
        ...testGame2,
        startTime: testGame.startTime,
        programType: ProgramType.LARP,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveSignedGames({
      username: mockUser.username,
      signedGames: [
        { ...mockSignedGames[0], priority: 2 },
        {
          // non-RPG signed game should be ignored
          gameDetails: { ...testGame2, programType: ProgramType.LARP },
          priority: 1,
          time: testGame.startTime,
          message: "",
        },
      ],
    });
    await saveSignedGames({
      username: mockUser2.username,
      signedGames: [
        { ...mockSignedGames[0], priority: 2 },
        {
          // non-RPG signed game should be ignored
          gameDetails: { ...testGame2, programType: ProgramType.LARP },
          priority: 1,
          time: testGame.startTime,
          message: "",
        },
      ],
    });

    // This should not be removed
    await saveSignup({
      ...mockPostEnteredGameRequest2,
      startTime: testGame.startTime,
    });

    const signupsBeforeUpdate = await findUserSignups(mockUser.username);
    expect(signupsBeforeUpdate.length).toEqual(1);

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(2);

    const signupsAfterUpdate = await findUserSignups(mockUser.username);

    const larpSignup = signupsAfterUpdate.find(
      (signup) => signup.game.programType === ProgramType.LARP
    );
    const rpgSignup = signupsAfterUpdate.find(
      (signup) => signup.game.programType === ProgramType.TABLETOP_RPG
    );

    expect(larpSignup?.userSignups.length).toEqual(1);
    expect(rpgSignup?.userSignups.length).toEqual(2);
  });

  test("should not remove directSignupAlwaysOpen signups if user doesn't have updated result", async () => {
    const directSignupAlwaysOpenId = sharedConfig.directSignupAlwaysOpen[0];
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
    const startingTime = testGame.startTime;

    // Populate database
    await saveGames([
      { ...testGame, minAttendance: 1 },
      {
        ...testGame2,
        startTime: testGame.startTime,
        gameId: directSignupAlwaysOpenId,
        minAttendance: 1,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveSignedGames({
      username: mockUser.username,
      signedGames: [
        { ...mockSignedGames[0], priority: 2 },
        {
          // directSignupAlwaysOpen signed game should be ignored
          gameDetails: {
            ...testGame2,
            gameId: directSignupAlwaysOpenId,
          },
          priority: 1,
          time: testGame.startTime,
          message: "",
        },
      ],
    });

    // This should not be removed
    await saveSignup({
      ...mockPostEnteredGameRequest2,
      username: mockUser2.username,
      startTime: testGame.startTime,
      enteredGameId: directSignupAlwaysOpenId,
    });

    const signupsBeforeUpdate = await findSignups();

    expect(signupsBeforeUpdate.length).toEqual(1);

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(1);
    assignResults.results.map((result) => {
      expect(result.enteredGame.gameDetails.gameId).toEqual(testGame.gameId);
    });

    const signupsAfterUpdate = await findSignups();

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === testGame.gameId
    );

    const directSignupAlwaysOpenSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === directSignupAlwaysOpenId
    );

    expect(assignmentSignup?.userSignups.length).toEqual(1);
    expect(directSignupAlwaysOpenSignup?.userSignups.length).toEqual(1);
    expect(directSignupAlwaysOpenSignup?.userSignups[0].username).toEqual(
      mockUser2.username
    );
  });

  test("should update directSignupAlwaysOpen signup with assignment signup if user has updated result", async () => {
    const directSignupAlwaysOpenId = sharedConfig.directSignupAlwaysOpen[0];
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;
    const startingTime = testGame.startTime;

    // Populate database
    await saveGames([
      testGame,
      {
        ...testGame2,
        startTime: testGame.startTime,
        gameId: directSignupAlwaysOpenId,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveSignedGames({
      username: mockUser.username,
      signedGames: [
        { ...mockSignedGames[0], priority: 2 },
        {
          // directSignupAlwaysOpen signed game should be ignored
          gameDetails: { ...testGame2, gameId: directSignupAlwaysOpenId },
          priority: 1,
          time: testGame.startTime,
          message: "",
        },
      ],
    });
    await saveSignedGames({
      username: mockUser2.username,
      signedGames: [
        { ...mockSignedGames[0], priority: 2 },
        {
          // directSignupAlwaysOpen signed game should be ignored
          gameDetails: { ...testGame2, gameId: directSignupAlwaysOpenId },
          priority: 1,
          time: testGame.startTime,
          message: "",
        },
      ],
    });

    // This should be removed and re-added by assignment
    await saveSignup(mockPostEnteredGameRequest);
    // This should be replaced by assignment
    await saveSignup({
      ...mockPostEnteredGameRequest2,
      startTime: testGame.startTime,
      enteredGameId: directSignupAlwaysOpenId,
    });

    const signupsBeforeUpdate = await findSignups();
    expect(signupsBeforeUpdate.length).toEqual(2);

    const assignResults = await runAssignment({
      assignmentStrategy,
      startingTime,
    });
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(2);
    assignResults.results.map((result) => {
      expect(result.enteredGame.gameDetails.gameId).toEqual(testGame.gameId);
    });

    const signupsAfterUpdate = await findSignups();

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === testGame.gameId
    );
    const directSignupAlwaysOpenSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === directSignupAlwaysOpenId
    );

    expect(assignmentSignup?.userSignups.length).toEqual(2);
    expect(directSignupAlwaysOpenSignup?.userSignups.length).toEqual(0);
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
