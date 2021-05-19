import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import moment from 'moment';
import { SettingsModel } from 'server/features/settings/settingsSchema';
import { mockGame, mockGame2 } from 'server/test/mock-data/mockGame';
import {
  findSettings,
  saveSignupTime,
  saveToggleAppOpen,
  saveHidden,
} from 'server/features/settings/settingsRepository';
import { saveGames } from 'server/features/game/gameRepository';

let mongoServer: MongoMemoryServer;

const options = {
  promiseLibrary: global.Promise,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getUri();
  await mongoose.connect(mongoUri, options);
});

afterEach(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('should set defaults if settings not found', async () => {
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

test('should update hidden games', async () => {
  const hiddenGames = [mockGame, mockGame2];
  await saveGames(hiddenGames);
  await saveHidden(hiddenGames);
  const insertedSettings = await SettingsModel.findOne({});
  expect(insertedSettings?.hiddenGames.length).toEqual(hiddenGames.length);
});

test('should not return hidden games that are not in DB', async () => {
  const hiddenGames = [mockGame, mockGame2];
  await saveHidden(hiddenGames);
  const insertedSettings = await SettingsModel.findOne({});
  expect(insertedSettings?.hiddenGames.length).toEqual(0);
});

test('should update signup time', async () => {
  const signupTime = '2019-07-26T14:00:00.000Z';
  await saveSignupTime(signupTime);
  const insertedSettings = await SettingsModel.findOne({});
  expect(moment(insertedSettings?.signupTime).format()).toEqual(
    moment(signupTime).format()
  );
});

test('should update appOpen status', async () => {
  const appOpen = false;
  await saveToggleAppOpen(appOpen);
  const insertedSettings = await SettingsModel.findOne({});
  expect(insertedSettings?.appOpen).toEqual(appOpen);
});
