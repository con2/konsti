import { expect, test, afterEach, beforeAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { removeOverlapSignups } from "server/features/player-assignment/utils/removeOverlapSignups";
import { mockUser, mockSignedGames } from "server/test/mock-data/mockUser";
import { mockResults } from "server/test/mock-data/mockResults";
import { testGame, testGame2 } from "shared/tests/testGame";
import { findUser, saveUser } from "server/features/user/userRepository";
import { findGames, saveGames } from "server/features/game/gameRepository";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
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

afterEach(async () => {
  await mongoServer.stop();
});

test("should remove overlapping signups from user", async () => {
  await saveGames([testGame, testGame2]);
  const insertedGamesAsyncResult = await findGames();
  const insertedGames = unsafelyUnwrapResult(insertedGamesAsyncResult);
  expect(insertedGames.length).toEqual(2);

  await saveUser(mockUser);
  await saveSignedGames({
    username: mockUser.username,
    signedGames: mockSignedGames,
  });
  const insertedUser = await findUser(mockUser.username);
  expect(insertedUser?.signedGames.length).toEqual(2);

  await removeOverlapSignups(mockResults);
  const updatedUser = await findUser(mockUser.username);

  expect(updatedUser?.signedGames.length).toEqual(1);
});
