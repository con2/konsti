import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { UserModel } from "server/features/user/userSchema";
import { GameModel } from "server/features/game/gameSchema";
import { removeOverlapSignups } from "server/features/player-assignment/utils/removeOverlapSignups";
import { mockUser, mockSignup } from "server/test/mock-data/mockUser";
import { mockResults } from "server/test/mock-data/mockResults";
import { testGame, testGame2 } from "shared/tests/testGame";
import { saveSignup, saveUser } from "server/features/user/userRepository";
import { saveGames } from "server/features/game/gameRepository";

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

test("should remove overlapping signups from user", async () => {
  await saveGames([testGame, testGame2]);
  const insertedGames = await GameModel.find({});
  expect(insertedGames.length).toEqual(2);

  await saveUser(mockUser);
  await saveSignup(mockSignup);
  const insertedUser = await UserModel.findOne({
    username: mockUser.username,
  });
  expect(insertedUser?.signedGames.length).toEqual(2);

  await removeOverlapSignups(mockResults);
  const updatedUser = await UserModel.findOne({
    username: mockUser.username,
  });
  expect(updatedUser?.signedGames.length).toEqual(1);
});
