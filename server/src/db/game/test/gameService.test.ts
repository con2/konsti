import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { GameModel } from 'server/db/game/gameSchema';
import { mockGame } from 'server/test/mock-data/mockGame';
import { saveGames } from 'server/db/game/gameService';

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

describe('Game service', () => {
  it('should insert new game into collection', async () => {
    await saveGames([mockGame]);

    const insertedGame = await GameModel.findOne({
      gameId: mockGame.gameId,
    });
    expect(insertedGame?.gameId).toEqual(mockGame.gameId);
  });
});
