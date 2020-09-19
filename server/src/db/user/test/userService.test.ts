import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { db } from 'db/mongodb';
import { UserModel } from 'db/user/userSchema';
import { UserGroup } from 'typings/user.typings';

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

describe('User service', () => {
  it('should insert new user into collection', async () => {
    const mockUser = {
      favoritedGames: [],
      username: 'test user',
      passwordHash: 'testpass',
      userGroup: UserGroup.user,
      serial: '1234ABCD',
      groupCode: '0',
      signedGames: [],
      enteredGames: [],
    };

    await db.user.saveUser(mockUser);

    const insertedUser = await UserModel.findOne({
      username: mockUser.username,
    });
    expect(insertedUser?.username).toEqual(mockUser.username);
  });
});
