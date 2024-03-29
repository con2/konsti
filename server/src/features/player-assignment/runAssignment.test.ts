import { expect, test, afterEach, beforeEach, describe } from "vitest";
import mongoose from "mongoose";
import dayjs from "dayjs";
import { faker } from "@faker-js/faker";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { generateTestData } from "server/test/test-data-generation/generators/generateTestData";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";
import { config } from "shared/config";
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
import { ProgramType } from "shared/types/models/game";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { assertUserUpdatedCorrectly } from "server/features/player-assignment/runAssignmentTestUtils";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { GameModel } from "server/features/game/gameSchema";

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
    const newGamesCount = 10;
    const testUsersCount = 0;

    await generateTestData(
      newUsersCount,
      newGamesCount,
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

    const startTime2 = dayjs(conventionStartTime).add(3, "hours").toISOString();

    const assignResultsEither2 = await runAssignment({
      assignmentStrategy,
      startTime: startTime2,
    });
    const assignResults2 = unsafelyUnwrapResult(assignResultsEither2);

    expect(assignResults2.status).toEqual("success");
    // Second assignment has less available players -> less results
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
    await saveGames([
      testGame,
      {
        ...testGame2,
        startTime: testGame.startTime,
        programType: ProgramType.TOURNAMENT,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveSignedGames({
      username: mockUser.username,
      signedGames: [
        { ...mockSignedGames[0], priority: 2 },
        {
          // non-"twoPhaseSignupProgramTypes" signed game should be ignored
          gameDetails: { ...testGame2, programType: ProgramType.TOURNAMENT },
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
          // non-"twoPhaseSignupProgramTypes" signed game should be ignored
          gameDetails: { ...testGame2, programType: ProgramType.TOURNAMENT },
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

    const signupsBeforeUpdateResult = await findUserSignups(mockUser.username);
    const signupsBeforeUpdate = unsafelyUnwrapResult(signupsBeforeUpdateResult);
    expect(signupsBeforeUpdate.length).toEqual(1);

    const assignResultsResult = await runAssignment({
      assignmentStrategy,
      startTime: testGame.startTime,
    });
    const assignResults = unsafelyUnwrapResult(assignResultsResult);

    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(2);

    const signupsAfterUpdateResult = await findUserSignups(mockUser.username);
    const signupsAfterUpdate = unsafelyUnwrapResult(signupsAfterUpdateResult);

    const tournamentSignup = signupsAfterUpdate.find(
      (signup) => signup.game.programType === ProgramType.TOURNAMENT,
    );
    const rpgSignup = signupsAfterUpdate.find(
      (signup) => signup.game.programType === ProgramType.TABLETOP_RPG,
    );

    expect(tournamentSignup?.userSignups.length).toEqual(1);
    expect(rpgSignup?.userSignups.length).toEqual(2);
  });

  test("should not remove directSignupAlwaysOpen signups if user doesn't have updated result", async () => {
    const directSignupAlwaysOpenId =
      config.shared().directSignupAlwaysOpenIds[0];
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;

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

    // This should not be removed even if start time is same as assignment time
    await saveSignup({
      ...mockPostEnteredGameRequest2,
      username: mockUser2.username,
      startTime: testGame.startTime,
      enteredGameId: directSignupAlwaysOpenId,
    });

    const signupsBeforeUpdateResult = await findSignups();
    const signupsBeforeUpdate = unsafelyUnwrapResult(signupsBeforeUpdateResult);

    const gamesWithSignups = signupsBeforeUpdate.filter(
      (signup) => signup.userSignups.length > 0,
    );
    expect(gamesWithSignups.length).toEqual(1);

    const assignResultsResult = await runAssignment({
      assignmentStrategy,
      startTime: testGame.startTime,
    });
    const assignResults = unsafelyUnwrapResult(assignResultsResult);

    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(1);
    assignResults.results.map((result) => {
      expect(result.enteredGame.gameDetails.gameId).toEqual(testGame.gameId);
    });

    const signupsAfterUpdateResult = await findSignups();
    const signupsAfterUpdate = unsafelyUnwrapResult(signupsAfterUpdateResult);

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === testGame.gameId,
    );

    const directSignupAlwaysOpenSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === directSignupAlwaysOpenId,
    );

    expect(assignmentSignup?.userSignups.length).toEqual(1);
    expect(directSignupAlwaysOpenSignup?.userSignups.length).toEqual(1);
    expect(directSignupAlwaysOpenSignup?.userSignups[0].username).toEqual(
      mockUser2.username,
    );
  });

  test("should update directSignupAlwaysOpen signup with assignment signup if user has updated result", async () => {
    const directSignupAlwaysOpenId =
      config.shared().directSignupAlwaysOpenIds[0];
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;

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

    const signupsBeforeUpdateResult = await findSignups();
    const signupsBeforeUpdate = unsafelyUnwrapResult(signupsBeforeUpdateResult);

    expect(signupsBeforeUpdate.length).toEqual(2);

    const assignResultsResult = await runAssignment({
      assignmentStrategy,
      startTime: testGame.startTime,
    });
    const assignResults = unsafelyUnwrapResult(assignResultsResult);

    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(2);
    assignResults.results.map((result) => {
      expect(result.enteredGame.gameDetails.gameId).toEqual(testGame.gameId);
    });

    const signupsAfterUpdateResult = await findSignups();
    const signupsAfterUpdate = unsafelyUnwrapResult(signupsAfterUpdateResult);

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === testGame.gameId,
    );
    const directSignupAlwaysOpenSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === directSignupAlwaysOpenId,
    );

    expect(assignmentSignup?.userSignups.length).toEqual(2);
    expect(directSignupAlwaysOpenSignup?.userSignups.length).toEqual(0);
  });

  test("should not remove previous signup from moved program item if user doesn't have updated result", async () => {
    // User1, game1: 14:00 direct signup -> game moved 15:00
    // User2, game2: 15:00 lottery signup -> doesn't affect user1 signup
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;

    const assignmentTime = dayjs(testGame.startTime)
      .add(1, "hours")
      .toISOString();

    await saveGames([
      { ...testGame },
      {
        ...testGame2,
        minAttendance: 1,
        startTime: assignmentTime,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    // User 1 has previous signup from moved program item - this should not be removed
    await saveSignup(mockPostEnteredGameRequest);

    await GameModel.updateOne(
      { gameId: testGame.gameId },
      {
        startTime: assignmentTime,
      },
    );

    // User 2 has selected program item for assignment
    await saveSignedGames({
      username: mockUser2.username,
      signedGames: [{ ...mockSignedGames[1] }],
    });

    const signupsBeforeUpdate = unsafelyUnwrapResult(await findSignups());
    const gamesWithSignups = signupsBeforeUpdate.filter(
      (signup) => signup.userSignups.length > 0,
    );
    expect(gamesWithSignups).toHaveLength(1);

    const assignResults = unsafelyUnwrapResult(
      await runAssignment({
        assignmentStrategy,
        startTime: assignmentTime,
      }),
    );
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results).toHaveLength(1);
    assignResults.results.map((result) => {
      expect(result.enteredGame.gameDetails.gameId).toEqual(testGame2.gameId);
    });

    const signupsAfterUpdate = unsafelyUnwrapResult(await findSignups());

    const previousSignupFromMovedProgramItem = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === testGame.gameId,
    );
    expect(previousSignupFromMovedProgramItem?.userSignups).toHaveLength(1);
    expect(previousSignupFromMovedProgramItem?.userSignups[0].username).toEqual(
      mockUser.username,
    );

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === testGame2.gameId,
    );
    expect(assignmentSignup?.userSignups).toHaveLength(1);
    expect(assignmentSignup?.userSignups[0].username).toEqual(
      mockUser2.username,
    );
  });

  test("should update previous signup from moved program item with assignment signup if user has updated result", async () => {
    // Game1: 14:00 direct signup -> game moved 15:00
    // Game2: 15:00 lottery signup -> replaces Game1
    const assignmentStrategy = AssignmentStrategy.RANDOM_PADG;

    const assignmentTime = dayjs(testGame.startTime)
      .add(1, "hours")
      .toISOString();

    await saveGames([
      { ...testGame },
      {
        ...testGame2,
        minAttendance: 1,
        startTime: assignmentTime,
      },
    ]);
    await saveUser(mockUser);

    await saveSignedGames({
      username: mockUser.username,
      signedGames: [
        {
          ...mockSignedGames[1],
        },
      ],
    });

    // User has previous signup from moved program item - this should be replaced by assignment result
    await saveSignup(mockPostEnteredGameRequest);

    await GameModel.updateOne(
      { gameId: testGame.gameId },
      {
        startTime: assignmentTime,
      },
    );

    const signupsBeforeUpdate = unsafelyUnwrapResult(await findSignups());
    const gamesWithSignups = signupsBeforeUpdate.filter(
      (signup) => signup.userSignups.length > 0,
    );
    expect(gamesWithSignups).toHaveLength(1);

    const assignResults = unsafelyUnwrapResult(
      await runAssignment({
        assignmentStrategy,
        startTime: assignmentTime,
      }),
    );
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results).toHaveLength(1);
    assignResults.results.map((result) => {
      expect(result.enteredGame.gameDetails.gameId).toEqual(testGame2.gameId);
    });

    const signupsAfterUpdate = unsafelyUnwrapResult(await findSignups());

    const previousSignupFromMovedProgramItem = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === testGame.gameId,
    );
    expect(previousSignupFromMovedProgramItem?.userSignups).toHaveLength(0);

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === testGame2.gameId,
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
    const tournamentGameId = "AIAHHUA";

    // Populate database
    await saveGames([
      { ...testGame, minAttendance: 1, maxAttendance: 1 },
      testGame2,
      {
        ...testGame2,
        programType: ProgramType.TOURNAMENT,
        gameId: tournamentGameId,
      },
      {
        ...testGame2,
        gameId: directSignupAlwaysOpenId,
      },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);

    await saveSignedGames({
      username: mockUser.username,
      signedGames: [{ ...mockSignedGames[0], priority: 1 }],
    });

    await saveSignedGames({
      username: mockUser2.username,
      signedGames: [{ ...mockSignedGames[0], priority: 3 }],
    });

    await saveSignup({
      ...mockPostEnteredGameRequest2,
      username: mockUser.username,
      startTime: dayjs(testGame.startTime).subtract(1, "hours").toISOString(),
    });

    // Tournament signup should not affect the bonus
    await saveSignup({
      username: mockUser2.username,
      enteredGameId: tournamentGameId,
      startTime: dayjs(testGame.startTime).subtract(1, "hours").toISOString(),
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });

    // directSignupAlwaysOpen signup should not affect the bonus
    await saveSignup({
      username: mockUser2.username,
      enteredGameId: directSignupAlwaysOpenId,
      startTime: dayjs(testGame.startTime).subtract(2, "hours").toISOString(),
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });

    const signupsBeforeUpdateResult = await findSignups();
    const signupsBeforeUpdate = unsafelyUnwrapResult(signupsBeforeUpdateResult);
    const gamesWithSignups = signupsBeforeUpdate.filter(
      (signup) => signup.userSignups.length > 0,
    );
    expect(gamesWithSignups.length).toEqual(3);

    const assignResultsResult = await runAssignment({
      assignmentStrategy,
      startTime: testGame.startTime,
    });
    const assignResults = unsafelyUnwrapResult(assignResultsResult);
    expect(assignResults.status).toEqual("success");
    expect(assignResults.results.length).toEqual(1);

    const signupsAfterUpdateResult = await findSignups();
    const signupsAfterUpdate = unsafelyUnwrapResult(signupsAfterUpdateResult);

    const assignmentSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === testGame.gameId,
    );

    const previousRpgSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === testGame2.gameId,
    );

    const previousTournamentSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === tournamentGameId,
    );

    const previousDirectSignupAlwaysOpenSignup = signupsAfterUpdate.find(
      (signup) => signup.game.gameId === directSignupAlwaysOpenId,
    );

    expect(assignmentSignup?.userSignups[0]).toMatchObject({
      username: mockUser2.username,
      time: mockSignedGames[0].gameDetails.startTime,
      message: "",
      priority: 3,
    });
    expect(previousRpgSignup?.userSignups[0]).toMatchObject({
      username: mockUser.username,
      time: dayjs(testGame.startTime).subtract(1, "hours").toISOString(),
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });
    expect(previousTournamentSignup?.userSignups[0]).toMatchObject({
      username: mockUser2.username,
      time: dayjs(testGame.startTime).subtract(1, "hours").toISOString(),
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });
    expect(previousDirectSignupAlwaysOpenSignup?.userSignups[0]).toMatchObject({
      username: mockUser2.username,
      time: dayjs(testGame.startTime).subtract(2, "hours").toISOString(),
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    });
  });
});
