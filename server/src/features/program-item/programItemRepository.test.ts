import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { ProgramItemModel } from "server/features/program-item/programItemSchema";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { testProgramItem } from "shared/tests/testProgramItem";
import { removeDeletedProgramItems } from "server/features/program-item/programItemUtils";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
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

  const insertedProgramItem = await ProgramItemModel.findOne({
    programItemId: testProgramItem.programItemId,
  });
  expect(insertedProgramItem?.programItemId).toEqual(
    testProgramItem.programItemId,
  );
});

test("should remove signup document when program item is removed", async () => {
  await saveProgramItems([testProgramItem]);

  const signups = unsafelyUnwrap(await findDirectSignups());
  expect(signups).toHaveLength(1);

  const currentProgramItems = unsafelyUnwrap(await findProgramItems());
  const deletedProgramItemsCount = unsafelyUnwrap(
    await removeDeletedProgramItems([], currentProgramItems),
  );
  expect(deletedProgramItemsCount).toEqual(1);

  const signups2 = unsafelyUnwrap(await findDirectSignups());
  expect(signups2).toHaveLength(0);
});
