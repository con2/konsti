import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import {
  findSettings,
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

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should set defaults if settings not found", async () => {
  await findSettings();
  const defaultSettings = {
    hiddenProgramItemIds: [],
    signupTime: null,
    appOpen: true,
  };
  const insertedSettings = unsafelyUnwrap(await findSettings());
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
  const insertedSettings = unsafelyUnwrap(await findSettings());
  expect(insertedSettings.hiddenProgramItemIds.length).toEqual(
    hiddenProgramItems.length,
  );
});

test("should update appOpen status", async () => {
  const appOpen = false;
  await saveSettings({ appOpen });
  const insertedSettings = unsafelyUnwrap(await findSettings());
  expect(insertedSettings.appOpen).toEqual(appOpen);
});

test("should not save multiple signup questions for same programItemId", async () => {
  // This will create default settings
  await findSettings();

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

  const settings = unsafelyUnwrap(await findSettings());
  expect(settings.signupQuestions).toHaveLength(1);
});
