import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserModel } from 'server/features/user/userSchema';
import {
  delEnteredGame,
  saveEnteredGame,
  saveUser,
} from 'server/features/user/userRepository';
import { mockGame } from 'server/test/mock-data/mockGame';
import { saveGames } from 'server/features/game/gameRepository';
import {
  mockPostEnteredGameRequest,
  mockUser,
} from 'server/test/mock-data/mockUser';

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

test('should insert new user into collection', async () => {
  await saveUser(mockUser);

  const insertedUser = await UserModel.findOne({
    username: mockUser.username,
  });
  expect(insertedUser?.username).toEqual(mockUser.username);
});

test('should add new enteredGame for user', async () => {
  await saveUser(mockUser);
  await saveGames([mockGame]);

  const response = await saveEnteredGame(mockPostEnteredGameRequest);

  expect(response.enteredGames[0].gameDetails.gameId).toEqual(mockGame.gameId);
});

test('should delete enteredGame from user', async () => {
  await saveUser(mockUser);
  await saveGames([mockGame]);
  await saveEnteredGame(mockPostEnteredGameRequest);

  const response = await delEnteredGame(mockPostEnteredGameRequest);

  expect(response.enteredGames.length).toEqual(0);
});
