import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { SettingsModel } from "server/features/settings/settingsSchema";
import { testGame, testGame2 } from "shared/tests/testGame";
import {
  findSettings,
  saveHidden,
  saveSettings,
} from "server/features/settings/settingsRepository";
import { saveGames } from "server/features/game/gameRepository";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  await mongoose.connect(mongoServer.getUri(), {
    dbName: faker.random.alphaNumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

afterAll(async () => {
  await mongoServer.stop();
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
    defaultSettings.hiddenGames.length
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
