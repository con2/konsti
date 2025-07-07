import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import {
  findProgramItemById,
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { handleCanceledDeletedProgramItems } from "server/features/program-item/programItemUtils";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import {
  findDirectSignups,
  findUserDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockLotterySignups,
  mockPostDirectSignupRequest,
  mockPostDirectSignupRequest2,
  mockUser,
} from "server/test/mock-data/mockUser";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { saveFavorite } from "server/features/user/favorite-program-item/favoriteProgramItemRepository";
import { State } from "shared/types/models/programItem";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should insert new program item into collection", async () => {
  await saveProgramItems([testProgramItem]);

  const insertedProgramItem = unsafelyUnwrap(
    await findProgramItemById(testProgramItem.programItemId),
  );
  expect(insertedProgramItem.programItemId).toEqual(
    testProgramItem.programItemId,
  );
});

test("should remove signup document when program item is removed", async () => {
  await saveProgramItems([testProgramItem]);

  const signups = unsafelyUnwrap(await findDirectSignups());
  expect(signups).toHaveLength(1);

  const currentProgramItems = unsafelyUnwrap(await findProgramItems());
  const response = unsafelyUnwrap(
    await handleCanceledDeletedProgramItems([], currentProgramItems),
  );
  expect(response.deleted).toHaveLength(1);

  const signups2 = unsafelyUnwrap(await findDirectSignups());
  expect(signups2).toHaveLength(0);
});

test("should remove lottery signups, direct signups and favorites when program item is deleted or cancelled", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveDirectSignup(mockPostDirectSignupRequest);
  await saveDirectSignup(mockPostDirectSignupRequest2);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });
  await saveFavorite({
    username: mockUser.username,
    favoriteProgramItemIds: [
      testProgramItem.programItemId,
      testProgramItem2.programItemId,
    ],
  });

  await saveProgramItems([
    { ...testProgramItem, state: State.CANCELLED },
    testProgramItem2,
  ]);

  // Should have removed favorite and lottery signup
  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.favoriteProgramItemIds).toHaveLength(1);
  expect(user?.favoriteProgramItemIds[0]).toEqual(
    testProgramItem2.programItemId,
  );
  expect(user?.lotterySignups).toHaveLength(1);
  expect(user?.lotterySignups[0].programItemId).toEqual(
    testProgramItem2.programItemId,
  );

  // Should have removed direct signup
  const directSignups = unsafelyUnwrap(
    await findUserDirectSignups(mockUser.username),
  );
  expect(directSignups).toHaveLength(1);
  expect(directSignups[0].programItemId).toEqual(
    testProgramItem2.programItemId,
  );
});
