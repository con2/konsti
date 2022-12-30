import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
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

test("should delete signup from user even if signup time is different from game start time", async () => {
  await saveUser(mockUser);
  await saveGames([testGame]);
  await saveSignup(mockPostEnteredGameRequest);

  const response = await delSignup({
    ...mockPostEnteredGameRequest,
    startTime: dayjs(testGame.startTime).add(1, "hours").format(),
  });

  expect(response.userSignups.length).toEqual(0);
});
