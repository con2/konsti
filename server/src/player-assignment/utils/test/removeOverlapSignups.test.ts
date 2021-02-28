import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { db } from 'server/db/mongodb';
import { UserModel } from 'server/db/user/userSchema';
import { GameModel } from 'server/db/game/gameSchema';
import { removeOverlapSignups } from 'server/player-assignment/utils/removeOverlapSignups';
import { mockUser, mockSignup } from 'server/test/mock-data/mockUser';
import { mockResults } from 'server/test/mock-data/mockResults';
import { mockGame, mockGame2 } from 'server/test/mock-data/mockGame';

let mongoServer: MongoMemoryServer;

const options = {
  promiseLibrary: global.Promise,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getUri();
  await mongoose.connect(mongoUri, options);
});

afterEach(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('removeOverlapSignups', () => {
  it('should remove overlapping signups from user', async () => {
    await db.game.saveGames([mockGame, mockGame2]);
    const insertedGames = await GameModel.find({});
    expect(insertedGames.length).toEqual(2);

    await db.user.saveUser(mockUser);
    await db.user.saveSignup(mockSignup);
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
});
