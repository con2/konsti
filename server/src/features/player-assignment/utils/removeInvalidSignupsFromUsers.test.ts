import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { UserModel } from "server/features/user/userSchema";
import { GameModel } from "server/features/game/gameSchema";
import { mockUser, mockSignedGames } from "server/test/mock-data/mockUser";
import { testGame, testGame2 } from "shared/tests/testGame";
import { removeInvalidGamesFromUsers } from "server/features/player-assignment/utils/removeInvalidGamesFromUsers";
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

afterAll(async () => {
  await mongoServer.stop();
});

test("should remove signups for invalid games from users", async () => {
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

  await GameModel.deleteOne({ gameId: game.gameId });

  await removeInvalidGamesFromUsers();
  const updatedUser = await UserModel.findOne({
    username: mockUser.username,
  });
  expect(updatedUser?.signedGames.length).toEqual(1);

  const insertedGames2 = await GameModel.find({});
  expect(insertedGames2.length).toEqual(1);
  expect(insertedGames2[0].gameId).toEqual(game2.gameId);
});
