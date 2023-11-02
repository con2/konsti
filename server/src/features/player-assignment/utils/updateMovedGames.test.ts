import { expect, test, afterEach, beforeAll, beforeEach } from "vitest";
import dayjs from "dayjs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { UserModel } from "server/features/user/userSchema";
import { GameModel } from "server/features/game/gameSchema";
import { mockUser, mockSignedGames } from "server/test/mock-data/mockUser";
import { testGame, testGame2 } from "shared/tests/testGame";
import { updateMovedGames } from "server/features/player-assignment/utils/updateMovedGames";
import { findUser, saveUser } from "server/features/user/userRepository";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { findGames, saveGames } from "server/features/game/gameRepository";
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

test("should remove lottery signups for moved games from users", async () => {
  await saveGames([testGame, testGame2]);
  const findGamesResult = await findGames();
  const insertedGames = unsafelyUnwrapResult(findGamesResult);
  expect(insertedGames.length).toEqual(2);

  await saveUser(mockUser);
  await saveSignedGames({
    username: mockUser.username,
    signedGames: mockSignedGames,
  });
  const insertedUser = await UserModel.findOne({
    username: mockUser.username,
  });
  expect(insertedUser?.signedGames.length).toEqual(2);

  await GameModel.updateOne(
    { gameId: testGame.gameId },
    {
      startTime: dayjs(testGame.startTime).add(1, "hours").toISOString(),
    },
  );

  await updateMovedGames(insertedGames);

  const findUserResult = await findUser(mockUser.username);
  const updatedUser = unsafelyUnwrapResult(findUserResult);

  expect(updatedUser?.signedGames.length).toEqual(1);
  expect(updatedUser?.signedGames[0].gameDetails.gameId).toEqual(
    testGame2.gameId,
  );
});
