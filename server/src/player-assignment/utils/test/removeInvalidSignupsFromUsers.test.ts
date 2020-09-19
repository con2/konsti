import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { db } from 'db/mongodb';
import { UserModel } from 'db/user/userSchema';
import { GameModel } from 'db/game/gameSchema';
import { mockUser, mockSignup } from 'test/mock-data/mockUser';
import { mockGame, mockGame2 } from 'test/mock-data/mockGame';
import { removeInvalidSignupsFromUsers } from 'player-assignment/utils/removeInvalidSignupsFromUsers';

let mongoServer: MongoMemoryServer;

const options = {
  promiseLibrary: global.Promise,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getConnectionString();
  await mongoose.connect(mongoUri, options);
});

afterEach(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('removeInvalidSignupsFromUsers', () => {
  it('should remove signups for invalid games from users', async () => {
    const game = new GameModel(mockGame);
    await game.save();
    const game2 = new GameModel(mockGame2);
    await game2.save();
    const insertedGames = await GameModel.find({});
    expect(insertedGames.length).toEqual(2);

    await db.user.saveUser(mockUser);
    await db.user.saveSignup(mockSignup);
    const insertedUser = await UserModel.findOne({
      username: mockUser.username,
    });
    expect(insertedUser?.signedGames.length).toEqual(2);

    await GameModel.deleteOne({ gameId: game.gameId });

    await removeInvalidSignupsFromUsers();
    const updatedUser = await UserModel.findOne({
      username: mockUser.username,
    });
    expect(updatedUser?.signedGames.length).toEqual(1);

    const insertedGames2 = await GameModel.find({});
    expect(insertedGames2.length).toEqual(1);
    expect(insertedGames2[0].gameId).toEqual(game2.gameId);
  });
});
