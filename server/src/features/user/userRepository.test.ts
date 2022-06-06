import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { UserModel } from "server/features/user/userSchema";
import { saveUser } from "server/features/user/userRepository";
import { mockUser } from "server/test/mock-data/mockUser";

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

test("should insert new user into collection", async () => {
  await saveUser(mockUser);

  const insertedUser = await UserModel.findOne({
    username: mockUser.username,
  });
  expect(insertedUser?.username).toEqual(mockUser.username);
});
