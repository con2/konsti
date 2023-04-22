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
} from "server/test/mock-data/mockUser";
import { delSignup, saveSignup } from "server/features/signup/signupRepository";

let mongoServer: MongoMemoryServer;

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

test("should add new signup for user", async () => {
  await saveUser(mockUser);
  await saveGames([testGame]);

  const response = await saveSignup(mockPostEnteredGameRequest);

  expect(response.game.gameId).toEqual(testGame.gameId);
  expect(response.userSignups[0].username).toEqual(mockUser.username);
});

test("should delete signup from user", async () => {
  await saveUser(mockUser);
  await saveGames([testGame]);
  await saveSignup(mockPostEnteredGameRequest);

  const response = await delSignup(mockPostEnteredGameRequest);

  expect(response.userSignups.length).toEqual(0);
});

test("should delete signup from user even if game start time has changed after signup", async () => {
  await saveUser(mockUser);
  await saveGames([testGame]);
  await saveSignup(mockPostEnteredGameRequest);

  const response = await delSignup({
    ...mockPostEnteredGameRequest,
    startTime: dayjs(testGame.startTime).add(1, "hours").format(),
  });

  expect(response.userSignups.length).toEqual(0);
});
