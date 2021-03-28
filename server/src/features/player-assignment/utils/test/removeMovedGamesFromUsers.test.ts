import moment from 'moment';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserModel } from 'server/features/user/userSchema';
import { GameModel } from 'server/features/game/gameSchema';
import { mockUser, mockSignup } from 'server/test/mock-data/mockUser';
import { mockGame, mockGame2 } from 'server/test/mock-data/mockGame';
import { removeMovedGamesFromUsers } from 'server/features/player-assignment/utils/removeMovedGamesFromUsers';
import { saveSignup, saveUser } from 'server/features/user/userRepository';

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

describe('removeMovedGamesFromUsers', () => {
  it('should remove signups for moved games from users', async () => {
    const game = new GameModel(mockGame);
    await game.save();
    const game2 = new GameModel(mockGame2);
    await game2.save();
    const insertedGames = await GameModel.find({});
    expect(insertedGames.length).toEqual(2);

    await saveUser(mockUser);
    await saveSignup(mockSignup);
    const insertedUser = await UserModel.findOne({
      username: mockUser.username,
    });
    expect(insertedUser?.signedGames.length).toEqual(2);

    await GameModel.updateOne(
      { gameId: game.gameId },
      {
        startTime: moment(game.startTime).add(1, 'hours').format(),
      }
    );

    await removeMovedGamesFromUsers(insertedGames);

    const updatedUser = await UserModel.findOne({
      username: mockUser.username,
    });
    expect(updatedUser?.signedGames.length).toEqual(1);
  });
});
