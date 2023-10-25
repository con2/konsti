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
import { AssignmentStrategy } from "shared/config/sharedConfig";
import { sharedConfig } from "shared/config/sharedConfig";
import { AssignmentResultStatus } from "server/typings/result.typings";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { testGame } from "shared/tests/testGame";
import { saveGames } from "server/features/game/gameRepository";
import { saveUser } from "server/features/user/userRepository";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import {
  mockPostEnteredGameRequest,
  mockSignedGames,
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
} from "server/test/mock-data/mockUser";
import {
  findSignups,
  saveSignup,
} from "server/features/signup/signupRepository";

let mongoServer: MongoMemoryServer;

// This needs to be adjusted if test data is changed
const expectedResultsCount = 20;
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

test("Assignment with valid data should return success with padg strategy", async () => {
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

  const { CONVENTION_START_TIME } = sharedConfig;
  const assignmentStrategy = AssignmentStrategy.PADG;
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

test("Should adjust attendee limits if there are previous signups from moved program items", async () => {
  const assignmentStrategy = AssignmentStrategy.PADG;

  await saveGames([{ ...testGame, minAttendance: 2, maxAttendance: 2 }]);
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveUser(mockUser3);
  await saveUser(mockUser4);

  // ** Save previous signups

  // This should remain because of different startTime
  await saveSignup({
    ...mockPostEnteredGameRequest,
    startTime: dayjs(testGame.startTime).subtract(1, "hours").toISOString(),
  });

  // This should be removed becase of same startTime
  await saveSignup({
    ...mockPostEnteredGameRequest,
    username: mockUser2.username,
  });

  // ** Save selected games

  // This will get assigned
  await saveSignedGames({
    username: mockUser3.username,
    signedGames: [{ ...mockSignedGames[0], priority: 1 }],
  });

  // This will not get assigned because program item full
  await saveSignedGames({
    username: mockUser4.username,
    signedGames: [{ ...mockSignedGames[0], priority: 3 }],
  });

  const assignResults = unsafelyUnwrapResult(
    await runAssignment({
      assignmentStrategy,
      startTime: testGame.startTime,
    }),
  );
  expect(assignResults.status).toEqual("success");
  expect(assignResults.results.length).toEqual(1);

  const signupsAfterUpdate = unsafelyUnwrapResult(await findSignups());

  const assignmentSignup = signupsAfterUpdate.find(
    (signup) => signup.game.gameId === testGame.gameId,
  );

  expect(assignmentSignup?.userSignups).toMatchObject([
    {
      username: mockUser.username,
      time: dayjs(testGame.startTime).subtract(1, "hours").toISOString(),
      message: "",
      priority: 0,
    },
    {
      username: mockUser3.username,
      time: mockSignedGames[0].gameDetails.startTime,
      message: "",
      priority: 1,
    },
  ]);
});

test("Assignment with no games should return error with padg strategy", async () => {
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

  const { CONVENTION_START_TIME } = sharedConfig;
  const assignmentStrategy = AssignmentStrategy.PADG;
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

test("Assignment with no players should return error with padg strategy", async () => {
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

  const { CONVENTION_START_TIME } = sharedConfig;
  const assignmentStrategy = AssignmentStrategy.PADG;
  const startTime = dayjs(CONVENTION_START_TIME).add(2, "hours").toISOString();

  const assignResultsResult = await runAssignment({
    assignmentStrategy,
    startTime,
  });
  const assignResults = unsafelyUnwrapResult(assignResultsResult);

  expect(assignResults.status).toEqual(AssignmentResultStatus.NO_SIGNUP_WISHES);
});
