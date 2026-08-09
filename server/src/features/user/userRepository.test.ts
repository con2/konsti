import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import {
  findUser,
  findUsers,
  saveUser,
} from "server/features/user/userRepository";
import { mockUser, mockUser2 } from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { testProgramItem } from "shared/tests/testProgramItem";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { db } from "server/db/mongodb";
import { MongoDbError } from "shared/types/api/errors";
import { makeErrorResult } from "shared/utils/result";

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, faker.string.alphanumeric(10));
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should insert new user into collection", async () => {
  await saveProgramItems([testProgramItem]);
  await saveUser(mockUser);

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user).toMatchObject({
    username: mockUser.username,
    password: mockUser.passwordHash,
    serial: mockUser.serial,
    userGroup: mockUser.userGroup,
    groupCode: mockUser.groupCode,
  });
});

test("should find all users", async () => {
  await saveProgramItems([testProgramItem]);
  await saveUser(mockUser);
  await saveUser(mockUser2);

  const users = unsafelyUnwrap(await findUsers());
  expect(users).toHaveLength(2);
});

test("should not insert a second user with an existing username", async () => {
  await saveProgramItems([testProgramItem]);
  await saveUser(mockUser);

  const duplicateResult = await saveUser({
    ...mockUser,
    serial: "9999ZZZZ",
  });

  expect(duplicateResult).toEqual(makeErrorResult(MongoDbError.UNKNOWN_ERROR));
  expect(unsafelyUnwrap(await findUsers())).toHaveLength(1);
});

test("should find users by username", async () => {
  await saveProgramItems([testProgramItem]);
  await saveUser(mockUser);
  await saveUser(mockUser2);

  const users = unsafelyUnwrap(await findUsers([mockUser.username]));
  expect(users).toHaveLength(1);
  expect(users[0].username).toEqual(mockUser.username);
});
