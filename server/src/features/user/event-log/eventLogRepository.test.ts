import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test } from "vitest";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { EventLogAction } from "shared/types/models/eventLog";
import { db } from "server/db/mongodb";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import {
  addEventLogItems,
  deleteEventLogItemsByStartTime,
} from "server/features/user/event-log/eventLogRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import { UserModel } from "server/features/user/userSchema";
import { mockUser, mockUser2, mockUser3 } from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should insert new event log items to user", async () => {
  await saveProgramItems([testProgramItem]);
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveUser(mockUser3);

  await addEventLogItems([
    {
      username: mockUser.username,
      programItemId: testProgramItem.programItemId,
      programItemStartTime: testProgramItem.startTime,
      createdAt: "2019-07-26T17:00:00.000Z",
      action: EventLogAction.NEW_ASSIGNMENT,
    },
    {
      username: mockUser2.username,
      programItemId: testProgramItem.programItemId,
      programItemStartTime: testProgramItem.startTime,
      createdAt: "2020-07-26T17:00:00.000Z",
      action: EventLogAction.NEW_ASSIGNMENT,
    },
  ]);

  await addEventLogItems([
    {
      username: mockUser.username,
      programItemId: "",
      programItemStartTime: testProgramItem.startTime,
      createdAt: "2019-07-26T17:00:00.000Z",
      action: EventLogAction.NO_ASSIGNMENT,
    },
    {
      username: mockUser2.username,
      programItemId: "",
      programItemStartTime: testProgramItem.startTime,
      createdAt: "2020-07-26T17:00:00.000Z",
      action: EventLogAction.NO_ASSIGNMENT,
    },
  ]);

  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));

  expect(updatedUser).toMatchObject({
    username: mockUser.username,
    eventLogItems: [
      {
        action: EventLogAction.NEW_ASSIGNMENT,
        programItemId: testProgramItem.programItemId,
        programItemStartTime: testProgramItem.startTime,
        createdAt: "2019-07-26T17:00:00.000Z",
      },
      {
        action: EventLogAction.NO_ASSIGNMENT,
        programItemId: "",
        programItemStartTime: testProgramItem.startTime,
        createdAt: "2019-07-26T17:00:00.000Z",
      },
    ],
  });

  const updatedUser2 = unsafelyUnwrap(await findUser(mockUser2.username));

  expect(updatedUser2).toMatchObject({
    username: mockUser2.username,
    eventLogItems: [
      {
        action: EventLogAction.NEW_ASSIGNMENT,
        programItemId: testProgramItem.programItemId,
        programItemStartTime: testProgramItem.startTime,
        createdAt: "2020-07-26T17:00:00.000Z",
      },
      {
        action: EventLogAction.NO_ASSIGNMENT,
        programItemId: "",
        programItemStartTime: testProgramItem.startTime,
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
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);

  await addEventLogItems([
    {
      username: mockUser.username,
      programItemId: testProgramItem.programItemId,
      programItemStartTime: testProgramItem.startTime,
      createdAt: "2019-07-26T17:00:00.000Z",
      action: EventLogAction.NEW_ASSIGNMENT,
    },
    {
      username: mockUser.username,
      programItemId: testProgramItem2.programItemId,
      programItemStartTime: testProgramItem2.startTime,
      createdAt: "2020-07-26T17:00:00.000Z",
      action: EventLogAction.NEW_ASSIGNMENT,
    },
  ]);

  await addEventLogItems([
    {
      username: mockUser.username,
      programItemId: "",
      programItemStartTime: testProgramItem.startTime,
      createdAt: "2019-07-26T17:00:00.000Z",
      action: EventLogAction.NO_ASSIGNMENT,
    },
    {
      username: mockUser.username,
      programItemId: "",
      programItemStartTime: testProgramItem2.startTime,
      createdAt: "2020-07-26T17:00:00.000Z",
      action: EventLogAction.NO_ASSIGNMENT,
    },
  ]);

  await deleteEventLogItemsByStartTime(testProgramItem.startTime, [
    EventLogAction.NEW_ASSIGNMENT,
    EventLogAction.NO_ASSIGNMENT,
  ]);

  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));

  expect(updatedUser).toMatchObject({
    username: mockUser.username,
    eventLogItems: [
      {
        action: EventLogAction.NEW_ASSIGNMENT,
        programItemId: testProgramItem2.programItemId,
        programItemStartTime: testProgramItem2.startTime,
        createdAt: "2020-07-26T17:00:00.000Z",
      },
      {
        action: EventLogAction.NO_ASSIGNMENT,
        programItemId: "",
        programItemStartTime: testProgramItem2.startTime,
        createdAt: "2020-07-26T17:00:00.000Z",
      },
    ],
  });
});
