import { expect, test, afterEach, beforeAll, beforeEach } from "vitest";
import dayjs from "dayjs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { UserModel } from "server/features/user/userSchema";
import { GameModel } from "server/features/game/gameSchema";
import { mockUser, mockSignedGames } from "server/test/mock-data/mockUser";
import { testGame, testGame2 } from "shared/tests/testGame";
import { removeMovedGamesFromUsers } from "server/features/player-assignment/utils/removeMovedGamesFromUsers";
import { saveUser } from "server/features/user/userRepository";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";

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

afterEach(async () => {
  await mongoServer.stop();
});

test("should remove signups for moved games from users", async () => {
  const game = new GameModel(testGame);
  await game.save();
  const game2 = new GameModel(testGame2);
  await game2.save();
  const insertedGames = await GameModel.find({});
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
    { gameId: game.gameId },
    {
      startTime: dayjs(game.startTime).add(1, "hours").format(),
    }
  );

  await removeMovedGamesFromUsers(insertedGames);

  const updatedUser = await UserModel.findOne({
    username: mockUser.username,
  });
  expect(updatedUser?.signedGames.length).toEqual(1);
});
