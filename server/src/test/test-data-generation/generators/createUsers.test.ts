import { expect, test, afterEach, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { db } from "server/db/mongodb";
import {
  createIndividualUsers,
  createUsersInGroup,
} from "server/test/test-data-generation/generators/createUsers";
import { findUsers } from "server/features/user/userRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, faker.string.alphanumeric(10));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await mongoose.disconnect();
});

test("should give every generated user a username of their own", async () => {
  const individualCount = 5;
  const groupSize = 3;
  const groupCount = 2;

  // Force the collision the random names only produce once in a few thousand
  // runs: two users sharing a username both take part in the assignment, but
  // every username-filtered write lands on whichever was stored first
  vi.spyOn(faker.internet, "username").mockReturnValue("sameName");

  await createIndividualUsers(individualCount);
  for (let i = 0; i < groupCount; i++) {
    await createUsersInGroup({ groupSize, testUsers: false });
  }

  const users = unsafelyUnwrap(await findUsers());
  const usernames = users.map((user) => user.username);

  expect(usernames).toHaveLength(individualCount + groupSize * groupCount);
  expect(new Set(usernames).size).toEqual(usernames.length);
});
