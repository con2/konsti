import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { db } from "server/db/mongodb";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import {
  acquireAssignmentLock,
  createSettings,
  findOrCreateSettings,
  releaseAssignmentLock,
  saveHidden,
  saveSettings,
  saveSignupQuestion,
} from "server/features/settings/settingsRepository";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import {
  SignupQuestion,
  SignupQuestionType,
} from "shared/types/models/settings";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { MongoDbError } from "shared/types/api/errors";
import { makeErrorResult } from "shared/utils/result";

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, faker.string.alphanumeric(10));
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should set defaults if settings not found", async () => {
  await findOrCreateSettings();
  const defaultSettings = {
    hiddenProgramItemIds: [],
    signupTime: null,
    appOpen: true,
  };
  const insertedSettings = unsafelyUnwrap(await findOrCreateSettings());
  expect(insertedSettings.hiddenProgramItemIds.length).toEqual(
    defaultSettings.hiddenProgramItemIds.length,
  );
  expect(insertedSettings.appOpen).toEqual(defaultSettings.appOpen);
});

test("should update hidden program items", async () => {
  const hiddenProgramItems = [testProgramItem, testProgramItem2];
  await saveProgramItems(hiddenProgramItems);
  await saveHidden(
    hiddenProgramItems.map(
      (hiddenProgramItem) => hiddenProgramItem.programItemId,
    ),
  );
  const insertedSettings = unsafelyUnwrap(await findOrCreateSettings());
  expect(insertedSettings.hiddenProgramItemIds.length).toEqual(
    hiddenProgramItems.length,
  );
});

test("should update appOpen status", async () => {
  const appOpen = false;
  await saveSettings({ appOpen });
  const insertedSettings = unsafelyUnwrap(await findOrCreateSettings());
  expect(insertedSettings.appOpen).toEqual(appOpen);
});

test("should not save multiple signup questions for same programItemId", async () => {
  // This will create default settings
  await findOrCreateSettings();

  const signupQuestion: SignupQuestion = {
    programItemId: "p6673",
    questionFi: "Hahmoluokka",
    questionEn: "Character class",
    private: false,
    type: SignupQuestionType.TEXT,
    selectOptions: [],
  };

  await saveSignupQuestion(signupQuestion);
  await saveSignupQuestion(signupQuestion);

  const settings = unsafelyUnwrap(await findOrCreateSettings());
  expect(settings.signupQuestions).toHaveLength(1);
});

test("acquireAssignmentLock should return SETTINGS_NOT_FOUND when there is no settings row", async () => {
  const result = await acquireAssignmentLock();

  expect(result).toEqual(makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND));
});

test("acquireAssignmentLock should return ASSIGNMENT_LOCK_HELD when another run holds the lock", async () => {
  await findOrCreateSettings();
  const firstAcquire = await acquireAssignmentLock();
  expect(firstAcquire.ok).toEqual(true);

  const secondAcquire = await acquireAssignmentLock();

  expect(secondAcquire).toEqual(
    makeErrorResult(MongoDbError.ASSIGNMENT_LOCK_HELD),
  );
});

test("releaseAssignmentLock should free the lock so it can be acquired again", async () => {
  await findOrCreateSettings();
  const lockToken = unsafelyUnwrap(await acquireAssignmentLock());

  unsafelyUnwrap(await releaseAssignmentLock(lockToken));

  const reacquire = await acquireAssignmentLock();
  expect(reacquire.ok).toEqual(true);
});

test("should not create a second settings document when one exists", async () => {
  // There must only ever be one settings document. A second insert would be
  // returned by later reads depending on insert order and silently shadow the
  // stored settings, so creating again must yield the existing document
  await findOrCreateSettings();
  await saveSettings({ adminMessageEn: "stored message" });

  const created = unsafelyUnwrap(await createSettings());

  expect(created.adminMessageEn).toEqual("stored message");
  expect(unsafelyUnwrap(await findOrCreateSettings()).adminMessageEn).toEqual(
    "stored message",
  );
});
