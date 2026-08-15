import { faker } from "@faker-js/faker";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test } from "vitest";
import { db } from "server/db/mongodb";
import {
  findTestSettings,
  saveTestSettings,
} from "server/test/test-settings/testSettingsRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, faker.string.alphanumeric(10));
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should return default test settings when none are stored", async () => {
  const testSettings = unsafelyUnwrap(await findTestSettings());

  expect(testSettings).toEqual({ testTime: null });
});

test("should not store a document when reading missing test settings", async () => {
  // Reading must not write. A document inserted by a read races with the
  // upsert in saveTestSettings, and two inserts leave reads returning
  // whichever landed first, shadowing the stored time behind an empty default.
  // Concurrent reads are the case that used to insert
  const reads = await Promise.all([
    findTestSettings(),
    findTestSettings(),
    findTestSettings(),
  ]);
  for (const read of reads) {
    expect(unsafelyUnwrap(read)).toEqual({ testTime: null });
  }

  const testTime = "2026-07-24T12:00:00.000Z";
  await saveTestSettings({ testTime });

  expect(unsafelyUnwrap(await findTestSettings())).toEqual({ testTime });
});

test("should read back the stored time when a read races with the write", async () => {
  const testTime = "2026-07-24T12:00:00.000Z";

  await Promise.all([findTestSettings(), saveTestSettings({ testTime })]);

  expect(unsafelyUnwrap(await findTestSettings())).toEqual({ testTime });
});
