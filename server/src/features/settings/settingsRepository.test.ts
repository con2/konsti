import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { SettingsModel } from "server/features/settings/settingsSchema";
import { testGame, testGame2 } from "shared/tests/testGame";
import {
  findSettings,
  saveHidden,
  saveSettings,
  saveSignupQuestion,
} from "server/features/settings/settingsRepository";
import { saveGames } from "server/features/game/gameRepository";
import {
  SignupQuestion,
  SignupQuestionType,
} from "shared/typings/models/settings";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";

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
    hiddenGames: [],
    signupTime: null,
    appOpen: true,
  };
  const insertedSettings = await SettingsModel.findOne({});
  expect(insertedSettings?.hiddenGames.length).toEqual(
    defaultSettings.hiddenGames.length,
  );
  expect(insertedSettings?.appOpen).toEqual(defaultSettings.appOpen);
});

test("should update hidden games", async () => {
  const hiddenGames = [testGame, testGame2];
  await saveGames(hiddenGames);
  await saveHidden(hiddenGames);
  const insertedSettings = await SettingsModel.findOne({});
  expect(insertedSettings?.hiddenGames.length).toEqual(hiddenGames.length);
});

test("should not return hidden games that are not in DB", async () => {
  const hiddenGames = [testGame, testGame2];
  await saveHidden(hiddenGames);
  const insertedSettings = await SettingsModel.findOne({});
  expect(insertedSettings?.hiddenGames.length).toEqual(0);
});

test("should update appOpen status", async () => {
  const appOpen = false;
  await saveSettings({ appOpen });
  const insertedSettings = await SettingsModel.findOne({});
  expect(insertedSettings?.appOpen).toEqual(appOpen);
});

test("should not save multiple signup questions for same gameId", async () => {
  // This will create default settings
  await findSettings();

  const signupQuestion: SignupQuestion = {
    gameId: "p6673",
    questionFi: "Hahmoluokka",
    questionEn: "Character class",
    private: false,
    type: SignupQuestionType.TEXT,
    selectOptions: [],
  };

  await saveSignupQuestion(signupQuestion);
  await saveSignupQuestion(signupQuestion);

  const settings = unsafelyUnwrapResult(await findSettings());
  expect(settings.signupQuestions).toHaveLength(1);
});
