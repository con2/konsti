import { Server } from "http";
import {
  expect,
  test,
  afterEach,
  beforeAll,
  beforeEach,
  vi,
  describe,
} from "vitest";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { startServer, closeServer } from "server/utils/server";
import {
  autoAssignAttendees,
  autoUpdateProgramItems,
  setLatestServerStartTime,
} from "server/utils/cron";
import {
  createSettings,
  findSettings,
  saveSettings,
} from "server/features/settings/settingsRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";
import { config } from "shared/config";
import { ConventionName } from "shared/config/sharedConfigTypes";

let server: Server;

const timeNow = "2019-07-26T17:00:00.000Z";
const previousJobRunning = 30; // Seconds since last run
const previousJobFinished = 31; // Seconds since last run

beforeAll(() => {
  vi.setSystemTime(timeNow);
});

beforeEach(async () => {
  vi.spyOn(config, "shared").mockReturnValue({
    ...config.shared(),
    conventionName: ConventionName.ROPECON,
  });
  vi.spyOn(config, "server").mockReturnValue({
    ...config.server(),
    useLocalProgramFile: true,
  });
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
    enableSentry: false,
  });
  await createSettings();
  await saveTestSettings({ testTime: timeNow });
  await setLatestServerStartTime();
});

afterEach(async () => {
  await closeServer(server);
});

describe("Progam update cronjob", () => {
  test("should run program update and set programUpdateLastRun time", async () => {
    const infoLoggerSpy = vi.spyOn(logger, "info");

    const oldTime = dayjs(timeNow)
      .subtract(previousJobFinished, "seconds")
      .toISOString();
    await saveSettings({ programUpdateLastRun: oldTime });

    await autoUpdateProgramItems();

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Auto update not running, continue",
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "***** Program items auto update completed",
    );

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.programUpdateLastRun).toEqual(timeNow);
  });

  test("should not start update if program update is already running", async () => {
    const infoLoggerSpy = vi.spyOn(logger, "info");
    const errorLoggerSpy = vi.spyOn(logger, "error");

    const oldTime = dayjs(timeNow)
      .subtract(previousJobRunning, "seconds")
      .toISOString();
    await saveSettings({ programUpdateLastRun: oldTime });

    await autoUpdateProgramItems();

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      "%s",
      new Error("Program auto update already running, stop"),
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Program items auto update completed",
    );

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.programUpdateLastRun).toEqual(oldTime);
  });

  test("if cronjob is run twice, should run program update only once", async () => {
    const infoLoggerSpy = vi.spyOn(logger, "info");
    const errorLoggerSpy = vi.spyOn(logger, "error");

    const oldTime = dayjs(timeNow)
      .subtract(previousJobFinished, "seconds")
      .toISOString();
    await saveSettings({ programUpdateLastRun: oldTime });

    await Promise.all([autoUpdateProgramItems(), autoUpdateProgramItems()]);

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Auto update not running, continue",
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      "%s",
      new Error("Program auto update already running, stop"),
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "***** Program items auto update completed",
    );

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.programUpdateLastRun).toEqual(timeNow);
  });

  test("should not run program update if newer server instance is started", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");

    const oldTime = dayjs(timeNow).subtract(1, "seconds").toISOString();
    await saveSettings({ latestServerStartTime: oldTime });

    await autoUpdateProgramItems();

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      "%s",
      new Error("Cronjobs: Newer server instance running, stop"),
    );

    const settings = unsafelyUnwrapResult(await findSettings());
    expect(settings.latestServerStartTime).toEqual(oldTime);
  });
});

describe("Assignment cronjob", () => {
  test("should run assignment and set assignmentLastRun time", async () => {
    const infoLoggerSpy = vi.spyOn(logger, "info");

    const oldTime = dayjs(timeNow)
      .subtract(previousJobFinished, "seconds")
      .toISOString();
    await saveSettings({ assignmentLastRun: oldTime });

    await autoAssignAttendees();

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Auto assignment not running, continue",
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "***** Automatic attendee assignment completed",
    );

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.assignmentLastRun).toEqual(timeNow);
  });

  test("should not run assignment if assignment is already running", async () => {
    const infoLoggerSpy = vi.spyOn(logger, "info");
    const errorLoggerSpy = vi.spyOn(logger, "error");

    const oldTime = dayjs(timeNow)
      .subtract(previousJobRunning, "seconds")
      .toISOString();
    await saveSettings({ assignmentLastRun: oldTime });

    await autoAssignAttendees();

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      "%s",
      new Error("Auto assignment already running, stop"),
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Automatic attendee assignment completed",
    );

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.assignmentLastRun).toEqual(oldTime);
  });

  test("if cronjob is run twice, should run assignment only once", async () => {
    const infoLoggerSpy = vi.spyOn(logger, "info");
    const errorLoggerSpy = vi.spyOn(logger, "error");

    const oldTime = dayjs(timeNow)
      .subtract(previousJobFinished, "seconds")
      .toISOString();
    await saveSettings({ assignmentLastRun: oldTime });

    await Promise.all([autoAssignAttendees(), autoAssignAttendees()]);

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Auto assignment not running, continue",
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      "%s",
      new Error("Auto assignment already running, stop"),
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "***** Automatic attendee assignment completed",
    );

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.assignmentLastRun).toEqual(timeNow);
  });

  test("should not run assignment if newer server instance is started", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");

    const oldTime = dayjs(timeNow).subtract(1, "seconds").toISOString();
    await saveSettings({ latestServerStartTime: oldTime });

    await autoAssignAttendees();

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      "%s",
      new Error("Cronjobs: Newer server instance running, stop"),
    );

    const settings = unsafelyUnwrapResult(await findSettings());
    expect(settings.latestServerStartTime).toEqual(oldTime);
  });
});
