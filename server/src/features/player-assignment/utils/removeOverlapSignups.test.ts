import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { removeOverlapSignups } from "server/features/player-assignment/utils/removeOverlapSignups";
import { mockUser, mockSignedGames } from "server/test/mock-data/mockUser";
import { mockResults } from "server/test/mock-data/mockResults";
import { testGame, testGame2 } from "shared/tests/testGame";
import { findUser, saveUser } from "server/features/user/userRepository";
import { findGames, saveGames } from "server/features/game/gameRepository";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";

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
  const insertedGames = await findGames();
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
