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
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { saveUser } from "server/features/user/userRepository";
import { testGame } from "shared/tests/testGame";
import { saveGames } from "server/features/game/gameRepository";
import {
  mockPostEnteredGameRequest,
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
} from "server/test/mock-data/mockUser";
import {
  delSignup,
  findSignups,
  saveSignup,
  saveSignups,
} from "server/features/signup/signupRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";

let mongoServer: MongoMemoryServer;

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

test("should add new signup for user", async () => {
  await saveUser(mockUser);
  await saveGames([testGame]);

  const responseResult = await saveSignup(mockPostEnteredGameRequest);
  const response = unsafelyUnwrapResult(responseResult);

  expect(response.game.gameId).toEqual(testGame.gameId);
  expect(response.userSignups[0].username).toEqual(mockUser.username);
});

test("should delete signup from user", async () => {
  await saveUser(mockUser);
  await saveGames([testGame]);
  await saveSignup(mockPostEnteredGameRequest);

  const responseResult = await delSignup(mockPostEnteredGameRequest);
  const response = unsafelyUnwrapResult(responseResult);

  expect(response.userSignups.length).toEqual(0);
});

test("should delete signup from user even if game start time has changed after signup", async () => {
  await saveUser(mockUser);
  await saveGames([testGame]);
  await saveSignup(mockPostEnteredGameRequest);

  const responseResult = await delSignup({
    ...mockPostEnteredGameRequest,
    startTime: dayjs(testGame.startTime).add(1, "hours").toISOString(),
  });
  const response = unsafelyUnwrapResult(responseResult);

  expect(response.userSignups.length).toEqual(0);
});

test("should limit max attendees if too many passed to saveSignups", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveUser(mockUser3);
  await saveUser(mockUser4);
  await saveGames([{ ...testGame, maxAttendance: 2 }]);

  const signups = [
    mockPostEnteredGameRequest,
    { ...mockPostEnteredGameRequest, username: mockUser2.username },
    { ...mockPostEnteredGameRequest, username: mockUser3.username },
    { ...mockPostEnteredGameRequest, username: mockUser4.username },
  ];

  const response = unsafelyUnwrapResult(await saveSignups(signups));
  expect(response.modifiedCount).toEqual(1);
  expect(response.droppedSignups).toHaveLength(2);

  const signupsAfterSave = unsafelyUnwrapResult(await findSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].count).toEqual(2);
  expect(signupsAfterSave[0].userSignups).toHaveLength(2);
});

test("should not add multiple duplicate signups for same user", async () => {
  await saveUser(mockUser);
  await saveGames([testGame]);

  await Promise.all([
    saveSignup(mockPostEnteredGameRequest),
    saveSignup(mockPostEnteredGameRequest),
    saveSignup(mockPostEnteredGameRequest),
    saveSignup(mockPostEnteredGameRequest),
  ]);

  const signupsAfterSave = unsafelyUnwrapResult(await findSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].count).toEqual(1);
  expect(signupsAfterSave[0].userSignups).toHaveLength(1);
});

test("should not delete multiple times if delete called multiple times", async () => {
  await saveUser(mockUser);
  await saveGames([testGame]);
  await saveSignup(mockPostEnteredGameRequest);

  await Promise.all([
    delSignup(mockPostEnteredGameRequest),
    delSignup(mockPostEnteredGameRequest),
    delSignup(mockPostEnteredGameRequest),
    delSignup(mockPostEnteredGameRequest),
  ]);

  const signupsAfterSave = unsafelyUnwrapResult(await findSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].count).toEqual(0);
  expect(signupsAfterSave[0].userSignups).toHaveLength(0);
});
