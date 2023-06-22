import {
  expect,
  test,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
} from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import {
  findUser,
  findUsers,
  saveUser,
} from "server/features/user/userRepository";
import { mockUser, mockUser2 } from "server/test/mock-data/mockUser";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { testGame } from "shared/tests/testGame";
import { saveGames } from "server/features/game/gameRepository";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  await mongoose.connect(mongoServer.getUri(), {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

afterAll(async () => {
  await mongoServer.stop();
});

test("should insert new user into collection", async () => {
  await saveGames([testGame]);
  await saveUser(mockUser);

  const findUserResult = await findUser(mockUser.username);
  const user = unsafelyUnwrapResult(findUserResult);
  expect(user).toMatchObject({
    username: mockUser.username,
    password: mockUser.passwordHash,
    serial: mockUser.serial,
    userGroup: mockUser.userGroup,
    groupCode: mockUser.groupCode,
  });
});

test("should find all users", async () => {
  await saveGames([testGame]);
  await saveUser(mockUser);
  await saveUser(mockUser2);

  const findUsersResult = await findUsers();
  const users = unsafelyUnwrapResult(findUsersResult);
  expect(users).toHaveLength(2);
});

test("should find users by username", async () => {
  await saveGames([testGame]);
  await saveUser(mockUser);
  await saveUser(mockUser2);

  const findUsersResult = await findUsers([mockUser.username]);
  const users = unsafelyUnwrapResult(findUsersResult);
  expect(users).toHaveLength(1);
  expect(users[0].username).toEqual(mockUser.username);
});
