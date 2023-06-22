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
import { findUser, saveUser } from "server/features/user/userRepository";
import { mockUser, mockUser2, mockUser3 } from "server/test/mock-data/mockUser";
import {
  addEventLogItems,
  deleteEventLogItemsByStartTime,
} from "server/features/user/event-log/eventLogRepository";
import { EventLogAction } from "shared/typings/models/eventLog";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { saveGames } from "server/features/game/gameRepository";
import { testGame, testGame2 } from "shared/tests/testGame";

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

test("should insert new event log item to user", async () => {
  await saveGames([testGame]);
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveUser(mockUser3);

  await addEventLogItems({
    updates: [
      {
        username: mockUser.username,
        programItemId: testGame.gameId,
        programItemStartTime: testGame.startTime,
        createdAt: "2019-07-26T17:00:00.000Z",
      },
      {
        username: mockUser2.username,
        programItemId: testGame.gameId,
        programItemStartTime: testGame.startTime,
        createdAt: "2020-07-26T17:00:00.000Z",
      },
    ],
    action: EventLogAction.NEW_ASSIGNMENT,
  });

  const updatedUserResult = await findUser(mockUser.username);
  const updatedUser = unsafelyUnwrapResult(updatedUserResult);

  expect(updatedUser).toMatchObject({
    username: mockUser.username,
    eventLogItems: [
      {
        action: EventLogAction.NEW_ASSIGNMENT,
        programItemId: testGame.gameId,
        programItemStartTime: testGame.startTime,
        createdAt: "2019-07-26T17:00:00.000Z",
      },
    ],
  });

  const updatedUserResult2 = await findUser(mockUser2.username);
  const updatedUser2 = unsafelyUnwrapResult(updatedUserResult2);

  expect(updatedUser2).toMatchObject({
    username: mockUser2.username,
    eventLogItems: [
      {
        action: EventLogAction.NEW_ASSIGNMENT,
        programItemId: testGame.gameId,
        programItemStartTime: testGame.startTime,
        createdAt: "2020-07-26T17:00:00.000Z",
      },
    ],
  });

  const updatedUser3 = await UserModel.findOne({
    username: mockUser3.username,
  });

  expect(updatedUser3).toMatchObject({
    username: mockUser3.username,
    eventLogItems: [],
  });
});

test("should delete event log items for start time", async () => {
  await saveGames([testGame, testGame2]);
  await saveUser(mockUser);

  await addEventLogItems({
    updates: [
      {
        username: mockUser.username,
        programItemId: testGame.gameId,
        programItemStartTime: testGame.startTime,
        createdAt: "2019-07-26T17:00:00.000Z",
      },
      {
        username: mockUser.username,
        programItemId: testGame2.gameId,
        programItemStartTime: testGame2.startTime,
        createdAt: "2020-07-26T17:00:00.000Z",
      },
    ],
    action: EventLogAction.NEW_ASSIGNMENT,
  });

  await deleteEventLogItemsByStartTime(testGame.startTime);

  const updatedUserResult = await findUser(mockUser.username);
  const updatedUser = unsafelyUnwrapResult(updatedUserResult);

  expect(updatedUser).toMatchObject({
    username: mockUser.username,
    eventLogItems: [
      {
        action: EventLogAction.NEW_ASSIGNMENT,
        programItemId: testGame2.gameId,
        programItemStartTime: testGame2.startTime,
        createdAt: "2020-07-26T17:00:00.000Z",
      },
    ],
  });
});
