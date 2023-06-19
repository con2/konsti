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
import { addToEventLogs } from "server/features/user/event-log/eventLogRepository";
import { EventLogAction } from "shared/typings/models/eventLog";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { saveGames } from "server/features/game/gameRepository";
import { testGame } from "shared/tests/testGame";

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

  await addToEventLogs({
    updates: [
      {
        username: mockUser.username,
        programItemId: testGame.gameId,
        createdAt: "2019-07-26T17:00:00Z",
      },
      {
        username: mockUser2.username,
        programItemId: testGame.gameId,
        createdAt: "2020-07-26T17:00:00Z",
      },
    ],
    action: EventLogAction.NEW_ASSIGNMENT,
  });

  const updatedUserResult = await findUser(mockUser.username);
  const updatedUser = unsafelyUnwrapResult(updatedUserResult);

  expect(updatedUser?.username).toEqual(mockUser.username);
  expect(updatedUser?.eventLogItems.length).toEqual(1);
  expect(updatedUser?.eventLogItems[0].action).toEqual(
    EventLogAction.NEW_ASSIGNMENT
  );
  expect(updatedUser?.eventLogItems[0].programItemId).toEqual(testGame.gameId);
  expect(updatedUser?.eventLogItems[0].createdAt).toEqual(
    "2019-07-26T17:00:00Z"
  );

  const updatedUserResult2 = await findUser(mockUser2.username);
  const updatedUser2 = unsafelyUnwrapResult(updatedUserResult2);

  expect(updatedUser2?.username).toEqual(mockUser2.username);
  expect(updatedUser2?.eventLogItems.length).toEqual(1);
  expect(updatedUser2?.eventLogItems[0].action).toEqual(
    EventLogAction.NEW_ASSIGNMENT
  );
  expect(updatedUser2?.eventLogItems[0].programItemId).toEqual(testGame.gameId);
  expect(updatedUser2?.eventLogItems[0].createdAt).toEqual(
    "2020-07-26T17:00:00Z"
  );

  const updatedUser3 = await UserModel.findOne({
    username: mockUser3.username,
  });

  expect(updatedUser3?.username).toEqual(mockUser3.username);
  expect(updatedUser3?.eventLogItems.length).toEqual(0);
});
