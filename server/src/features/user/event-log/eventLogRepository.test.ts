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
import { UserModel } from "server/features/user/userSchema";
import { saveUser } from "server/features/user/userRepository";
import { mockUser, mockUser2, mockUser3 } from "server/test/mock-data/mockUser";
import { addToEventLogs } from "server/features/user/event-log/eventLogRepository";
import { EventLogAction } from "shared/typings/models/eventLog";

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

test("should insert new action log item to user", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveUser(mockUser3);

  await addToEventLogs({
    updates: [
      { username: mockUser.username, eventItemTitle: "foo" },
      { username: mockUser2.username, eventItemTitle: "foo" },
    ],
    action: EventLogAction.NEW_ASSIGNMENT,
  });

  const updatedUser = await UserModel.findOne({
    username: mockUser.username,
  });

  expect(updatedUser?.username).toEqual(mockUser.username);
  expect(updatedUser?.eventLogItems.length).toEqual(1);
  expect(updatedUser?.eventLogItems[0].action).toEqual(
    EventLogAction.NEW_ASSIGNMENT
  );

  const updatedUser2 = await UserModel.findOne({
    username: mockUser2.username,
  });

  expect(updatedUser2?.username).toEqual(mockUser2.username);
  expect(updatedUser2?.eventLogItems.length).toEqual(1);
  expect(updatedUser2?.eventLogItems[0].action).toEqual(
    EventLogAction.NEW_ASSIGNMENT
  );

  const updatedUser3 = await UserModel.findOne({
    username: mockUser3.username,
  });

  expect(updatedUser3?.username).toEqual(mockUser3.username);
  expect(updatedUser3?.eventLogItems.length).toEqual(0);
});
