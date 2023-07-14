import { Server } from "http";
import {
  expect,
  test,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  vi,
  describe,
} from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { startServer, closeServer } from "server/utils/server";
import { autoAssignPlayers, autoUpdateGames } from "server/utils/cron";
import {
  createSettings,
  findSettings,
  saveSettings,
} from "server/features/settings/settingsRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";

let server: Server;
let mongoServer: MongoMemoryServer;

const timeNow = "2019-07-26T17:00:00.000Z";
const previousJobRunning = 30; // Seconds since last run
const previousJobFinished = 31; // Seconds since last run

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  // vi.useFakeTimers();
  vi.setSystemTime(timeNow);
});

beforeEach(async () => {
  server = await startServer({
    dbConnString: mongoServer.getUri(),
    dbName: faker.string.alphanumeric(10),
    enableSentry: false,
  });
  await createSettings();
});

afterEach(async () => {
  await closeServer(server);
});

afterAll(async () => {
  await mongoServer.stop();
});

describe("Progam update cronjob", () => {
  test("should run program update and set programUpdateLastRun time", async () => {
    const infoLoggerSpy = vi.spyOn(logger, "info");

    const oldTime = dayjs(timeNow)
      .subtract(previousJobFinished, "seconds")
      .toISOString();
    await saveSettings({ programUpdateLastRun: oldTime });

    await autoUpdateGames();

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Auto update not running, continue"
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "***** Games auto update completed"
    );

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.programUpdateLastRun).toEqual(timeNow);
  });

  test("should not start update if program update is already running", async () => {
    const infoLoggerSpy = vi.spyOn(logger, "info");

    const oldTime = dayjs(timeNow)
      .subtract(previousJobRunning, "seconds")
      .toISOString();
    await saveSettings({ programUpdateLastRun: oldTime });

    await autoUpdateGames();

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Auto update already running, stop"
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Games auto update completed"
    );

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.programUpdateLastRun).toEqual(oldTime);
  });

  test("if cronjob is run twice, should run program update only once", async () => {
    const infoLoggerSpy = vi.spyOn(logger, "info");

    const oldTime = dayjs(timeNow)
      .subtract(previousJobFinished, "seconds")
      .toISOString();
    await saveSettings({ programUpdateLastRun: oldTime });

    await Promise.all([autoUpdateGames(), autoUpdateGames()]);

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Auto update not running, continue"
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Auto update already running, stop"
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "***** Games auto update completed"
    );

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.programUpdateLastRun).toEqual(timeNow);
  });
});

describe("Assignment cronjob", () => {
  beforeEach(async () => {
    await saveTestSettings({ testTime: timeNow });
  });

  test("should run assignment and set assignmentLastRun time", async () => {
    const infoLoggerSpy = vi.spyOn(logger, "info");

    const oldTime = dayjs(timeNow)
      .subtract(previousJobFinished, "seconds")
      .toISOString();
    await saveSettings({ assignmentLastRun: oldTime });

    await autoAssignPlayers();

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Assignment not running, continue"
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "***** Automatic player assignment completed"
    );

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.assignmentLastRun).toEqual(timeNow);
  });

  test("should not run assignment if assignment is already running", async () => {
    const infoLoggerSpy = vi.spyOn(logger, "info");

    const oldTime = dayjs(timeNow)
      .subtract(previousJobRunning, "seconds")
      .toISOString();
    await saveSettings({ assignmentLastRun: oldTime });

    await autoAssignPlayers();

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Assignment already running, stop"
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Automatic player assignment completed"
    );

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.assignmentLastRun).toEqual(oldTime);
  });

  test("if cronjob is run twice, should run assignment only once", async () => {
    const infoLoggerSpy = vi.spyOn(logger, "info");

    const oldTime = dayjs(timeNow)
      .subtract(previousJobFinished, "seconds")
      .toISOString();
    await saveSettings({ assignmentLastRun: oldTime });

    await Promise.all([autoAssignPlayers(), autoAssignPlayers()]);

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Assignment not running, continue"
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Assignment already running, stop"
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "***** Automatic player assignment completed"
    );

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.assignmentLastRun).toEqual(timeNow);
  });
});
