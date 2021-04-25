import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserModel } from 'server/features/user/userSchema';
import { UserGroup } from 'shared/typings/models/user';
import { saveUser } from 'server/features/user/userRepository';

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

describe('User service', () => {
  it('should insert new user into collection', async () => {
    const mockUser = {
      favoritedGames: [],
      username: 'test user',
      passwordHash: 'testpass',
      userGroup: UserGroup.USER,
      serial: '1234ABCD',
      groupCode: '0',
      signedGames: [],
      enteredGames: [],
    };

    await saveUser(mockUser);

    const insertedUser = await UserModel.findOne({
      username: mockUser.username,
    });
    expect(insertedUser?.username).toEqual(mockUser.username);
  });
});
