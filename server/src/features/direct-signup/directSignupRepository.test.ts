import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { saveUser } from "server/features/user/userRepository";
import { testProgramItem } from "shared/tests/testProgramItem";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import {
  mockPostDirectSignupRequest,
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
} from "server/test/mock-data/mockUser";
import {
  delDirectSignup,
  findDirectSignups,
  saveDirectSignup,
  saveDirectSignups,
} from "server/features/direct-signup/directSignupRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { SignupRepositoryAddSignup } from "server/features/direct-signup/directSignupTypes";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should add new signup for user", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);

  const response = unsafelyUnwrap(
    await saveDirectSignup(mockPostDirectSignupRequest),
  );

  expect(response.programItem.programItemId).toEqual(
    testProgramItem.programItemId,
  );
  expect(response.userSignups[0].username).toEqual(mockUser.username);
});

test("should delete signup from user", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);
  await saveDirectSignup(mockPostDirectSignupRequest);

  const response = unsafelyUnwrap(
    await delDirectSignup(mockPostDirectSignupRequest),
  );

  expect(response.userSignups.length).toEqual(0);
});

test("should limit max attendees if too many passed to saveDirectSignups", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveUser(mockUser3);
  await saveUser(mockUser4);
  await saveProgramItems([{ ...testProgramItem, maxAttendance: 2 }]);

  const signups: SignupRepositoryAddSignup[] = [
    mockPostDirectSignupRequest,
    { ...mockPostDirectSignupRequest, username: mockUser2.username },
    { ...mockPostDirectSignupRequest, username: mockUser3.username },
    { ...mockPostDirectSignupRequest, username: mockUser4.username },
  ];

  const response = unsafelyUnwrap(await saveDirectSignups(signups));
  expect(response.modifiedCount).toEqual(1);
  expect(response.droppedSignups).toHaveLength(2);

  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].count).toEqual(2);
  expect(signupsAfterSave[0].userSignups).toHaveLength(2);
});

test("should not add multiple duplicate signups for same user", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);

  await Promise.all([
    saveDirectSignup(mockPostDirectSignupRequest),
    saveDirectSignup(mockPostDirectSignupRequest),
    saveDirectSignup(mockPostDirectSignupRequest),
    saveDirectSignup(mockPostDirectSignupRequest),
  ]);

  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].count).toEqual(1);
  expect(signupsAfterSave[0].userSignups).toHaveLength(1);
});

test("should not delete multiple times if delete called multiple times", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);
  await saveDirectSignup(mockPostDirectSignupRequest);

  await Promise.all([
    delDirectSignup(mockPostDirectSignupRequest),
    delDirectSignup(mockPostDirectSignupRequest),
    delDirectSignup(mockPostDirectSignupRequest),
    delDirectSignup(mockPostDirectSignupRequest),
  ]);

  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].count).toEqual(0);
  expect(signupsAfterSave[0].userSignups).toHaveLength(0);
});
