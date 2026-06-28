import { expect, test, afterEach, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import dayjs from "dayjs";
import { faker } from "@faker-js/faker";
import { config } from "shared/config";
import { saveUser } from "server/features/user/userRepository";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
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
  findDirectSignupsByProgramItemIds,
  findDirectSignupsByStartTime,
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
  vi.restoreAllMocks();
  await mongoose.disconnect();
});

test("should add new signup for user", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);

  const response = unsafelyUnwrap(
    await saveDirectSignup(mockPostDirectSignupRequest),
  );

  expect(response.programItemId).toEqual(testProgramItem.programItemId);
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

test("should fetch program item signups", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);
  await saveDirectSignup(mockPostDirectSignupRequest);

  const response = unsafelyUnwrap(
    await findDirectSignupsByProgramItemIds([testProgramItem.programItemId]),
  );

  expect(response[0].programItemId).toEqual(testProgramItem.programItemId);
  expect(response[0].userSignups[0].username).toEqual(mockUser.username);
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

  const programItems = unsafelyUnwrap(await findProgramItems());
  const response = unsafelyUnwrap(
    await saveDirectSignups(signups, programItems),
  );
  expect(response.modifiedCount).toEqual(1);
  expect(response.droppedSignups).toHaveLength(2);

  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].count).toEqual(2);
  expect(signupsAfterSave[0].userSignups).toHaveLength(2);
});

test("should set count to total userSignups when appending to a program item that already has signups", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveProgramItems([{ ...testProgramItem, maxAttendance: 5 }]);

  // Pre-existing signup, e.g. a non-lottery signup or one left over from a moved program item
  await saveDirectSignup(mockPostDirectSignupRequest);

  const programItems = unsafelyUnwrap(await findProgramItems());

  // Assignment appends a new signup to the same program item document
  const signups: SignupRepositoryAddSignup[] = [
    { ...mockPostDirectSignupRequest, username: mockUser2.username },
  ];
  unsafelyUnwrap(await saveDirectSignups(signups, programItems));

  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].userSignups).toHaveLength(2);
  // count must reflect the total userSignups, not just the appended batch
  expect(signupsAfterSave[0].count).toEqual(2);
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

test("should find direct signups for a parent-batched item by its parent start time", async () => {
  // The item is batched under a parent whose start time drives the lottery, so its own
  // start time differs from the assignment time
  const parentStartTime = dayjs(testProgramItem.startTime)
    .add(30, "minutes")
    .toISOString();

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);
  await saveDirectSignup(mockPostDirectSignupRequest);

  const programItems = unsafelyUnwrap(await findProgramItems());
  const signups = unsafelyUnwrap(
    await findDirectSignupsByStartTime(parentStartTime, programItems),
  );

  expect(signups).toHaveLength(1);
  expect(signups[0].programItemId).toEqual(testProgramItem.programItemId);
  expect(signups[0].username).toEqual(mockUser.username);
});
