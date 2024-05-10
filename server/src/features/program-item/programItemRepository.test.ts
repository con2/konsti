import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { ProgramItemModel } from "server/features/program-item/programItemSchema";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { testProgramItem } from "shared/tests/testProgramItem";
import { removeDeletedProgramItems } from "server/features/program-item/programItemUtils";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";

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

  const insertedGame = await ProgramItemModel.findOne({
    programItemId: testProgramItem.programItemId,
  });
  expect(insertedGame?.programItemId).toEqual(testProgramItem.programItemId);
});

test("should remove signup document when program item is removed", async () => {
  await saveProgramItems([testProgramItem]);

  const findSignupsResult = await findDirectSignups();
  const signups = unsafelyUnwrapResult(findSignupsResult);
  expect(signups).toHaveLength(1);

  const removeDeletedProgramItemsResult = await removeDeletedProgramItems([]);
  const deletedProgramItemsCount = unsafelyUnwrapResult(
    removeDeletedProgramItemsResult,
  );
  expect(deletedProgramItemsCount).toEqual(1);

  const findSignupsResult2 = await findDirectSignups();
  const signups2 = unsafelyUnwrapResult(findSignupsResult2);
  expect(signups2).toHaveLength(0);
});
