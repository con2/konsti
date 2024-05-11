import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { findUsers, saveUser } from "server/features/user/userRepository";
import { testProgramItem } from "shared/tests/testProgramItem";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import {
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
} from "server/test/mock-data/mockUser";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { saveUserSignupResults } from "server/features/player-assignment/utils/saveUserSignupResults";
import { AssignmentResult } from "shared/types/models/result";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should not add event log items after assigment if signup is dropped due to error", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveUser(mockUser3);
  await saveUser(mockUser4);
  await saveProgramItems([{ ...testProgramItem, maxAttendance: 3 }]);

  const results: AssignmentResult[] = [
    {
      username: mockUser.username,
      directSignup: {
        programItem: testProgramItem,
        priority: 1,
        time: testProgramItem.startTime,
        message: "",
      },
    },
    {
      username: mockUser2.username,
      directSignup: {
        programItem: testProgramItem,
        priority: 1,
        time: testProgramItem.startTime,
        message: "",
      },
    },
    {
      username: mockUser3.username,
      directSignup: {
        programItem: testProgramItem,
        priority: 1,
        time: testProgramItem.startTime,
        message: "",
      },
    },
    {
      username: mockUser4.username,
      directSignup: {
        programItem: testProgramItem,
        priority: 1,
        time: testProgramItem.startTime,
        message: "",
      },
    },
  ];

  await saveUserSignupResults(testProgramItem.startTime, results);

  const signupsAfterSave = unsafelyUnwrapResult(await findDirectSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].count).toEqual(3);
  expect(signupsAfterSave[0].userSignups).toHaveLength(3);

  const usersAfterSave = unsafelyUnwrapResult(await findUsers());
  const usersWithoutEventLogItem = usersAfterSave.filter(
    (user) => user.eventLogItems.length === 0,
  );
  const usersWithEventLogItem = usersAfterSave.filter(
    (user) => user.eventLogItems.length === 1,
  );
  expect(usersWithoutEventLogItem).toHaveLength(1);
  expect(usersWithEventLogItem).toHaveLength(3);
});
