import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { ProgramItemModel } from "server/features/program-item/programItemSchema";
import { mockUser, mockLotterySignups } from "server/test/mock-data/mockUser";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { removeInvalidProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
import { findUser, saveUser } from "server/features/user/userRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { saveFavorite } from "server/features/user/favorite-program-item/favoriteProgramItemRepository";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should remove lottery signups and favorites for invalid program items from users", async () => {
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

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.lotterySignups).toHaveLength(2);
  expect(user?.favoriteProgramItemIds).toHaveLength(2);

  const programItems = unsafelyUnwrap(await findProgramItems());
  expect(programItems).toHaveLength(2);

  await ProgramItemModel.deleteOne({
    programItemId: testProgramItem.programItemId,
  });

  const updatedProgramItems = unsafelyUnwrap(await findProgramItems());
  expect(updatedProgramItems).toHaveLength(1);
  expect(updatedProgramItems[0].programItemId).toEqual(
    testProgramItem2.programItemId,
  );

  await removeInvalidProgramItemsFromUsers(updatedProgramItems);

  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));

  expect(updatedUser?.lotterySignups).toHaveLength(1);
  expect(updatedUser?.lotterySignups[0].programItemId).toEqual(
    testProgramItem2.programItemId,
  );

  expect(updatedUser?.favoriteProgramItemIds).toHaveLength(1);
  expect(updatedUser?.favoriteProgramItemIds[0]).toEqual(
    testProgramItem2.programItemId,
  );
});
