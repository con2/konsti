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
import { SignupType, State } from "shared/types/models/programItem";
import { EventLogAction } from "shared/types/models/eventLog";

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

test("should remove lottery signups and favorites when program item is deleted or cancelled", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
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
    { ...testProgramItem2, state: State.CANCELLED },
  ]);

  // Should have removed favorites and lottery signups
  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.favoriteProgramItemIds).toHaveLength(0);
  expect(user?.lotterySignups).toHaveLength(0);

  // Should have added new event log items
  expect(user?.eventLogItems).toHaveLength(2);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
    ]),
  );
});

test("should remove direct signups when program item is deleted or cancelled", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveDirectSignup(mockPostDirectSignupRequest);
  await saveDirectSignup(mockPostDirectSignupRequest2);

  await saveProgramItems([
    { ...testProgramItem, state: State.CANCELLED },
    { ...testProgramItem2, state: State.CANCELLED },
  ]);

  // Should have removed direct signups
  const directSignups = unsafelyUnwrap(
    await findUserDirectSignups(mockUser.username),
  );
  expect(directSignups).toHaveLength(0);

  // Should have added new event log items
  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.eventLogItems).toHaveLength(2);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
    ]),
  );
});

test("should remove lottery signups and favorites when program item doesn't use Konsti signup anymore", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
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
    { ...testProgramItem, signupType: SignupType.OTHER },
    { ...testProgramItem2, signupType: SignupType.OTHER },
  ]);

  // Should have removed favorites and lottery signups
  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.favoriteProgramItemIds).toHaveLength(0);
  expect(user?.lotterySignups).toHaveLength(0);

  // Should have added new event log items
  expect(user?.eventLogItems).toHaveLength(2);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
    ]),
  );
});

test("should remove direct signups when program item doesn't use Konsti signup anymore", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveDirectSignup(mockPostDirectSignupRequest);
  await saveDirectSignup(mockPostDirectSignupRequest2);

  await saveProgramItems([
    { ...testProgramItem, signupType: SignupType.OTHER },
    { ...testProgramItem2, signupType: SignupType.OTHER },
  ]);

  // Should have removed direct signups
  const directSignups = unsafelyUnwrap(
    await findUserDirectSignups(mockUser.username),
  );
  expect(directSignups).toHaveLength(0);

  // Should have added new event log items
  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.eventLogItems).toHaveLength(2);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
    ]),
  );
});
