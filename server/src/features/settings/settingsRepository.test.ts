import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dayjs from "dayjs";
import { SettingsModel } from "server/features/settings/settingsSchema";
import { testGame, testGame2 } from "shared/tests/testGame";
import {
  findSettings,
  saveHidden,
  saveSettings,
} from "server/features/settings/settingsRepository";
import { saveGames } from "server/features/game/gameRepository";

let mongoServer: MongoMemoryServer;

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  await mongoServer.start();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  await mongoose.disconnect();
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
  expect(insertedSettings?.signupTime).toEqual(defaultSettings.signupTime);
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

test("should update signup time", async () => {
  const signupTime = "2019-07-26T14:00:00.000Z";
  await saveSettings({ signupTime });
  const insertedSettings = await SettingsModel.findOne({});
  expect(dayjs(insertedSettings?.signupTime).format()).toEqual(
    dayjs(signupTime).format()
  );
});

test("should update appOpen status", async () => {
  const appOpen = false;
  await saveSettings({ appOpen });
  const insertedSettings = await SettingsModel.findOne({});
  expect(insertedSettings?.appOpen).toEqual(appOpen);
});
