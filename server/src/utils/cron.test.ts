import { randomUUID } from "node:crypto";
import { Server } from "node:http";
import { addSeconds, subMinutes, subSeconds } from "date-fns";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { config } from "shared/config";
import { EventName } from "shared/config/eventConfigTypes";
import { KompassiError } from "shared/types/api/errors";
import { makeErrorResult } from "shared/utils/result";
import { EmailSender } from "server/features/notifications/email";
import {
  ASSIGNMENT_LOCK_STALE_TIMEOUT_MINUTES,
  acquireAssignmentLock,
  createSettings,
  findOrCreateSettings,
  saveSettings,
} from "server/features/settings/settingsRepository";
import { testHelperWrapper } from "server/kompassi/getProgramItemsFromKompassi";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import {
  autoAssignAttendees,
  autoUpdateProgramItems,
  setLatestServerStartTime,
  startCronJobs,
  stopCronJobs,
} from "server/utils/cron";
import { logger } from "server/utils/logger";
import {
  createNotificationQueueService,
  getGlobalNotificationQueueService,
} from "server/utils/notificationQueue";
import { closeServer, startServer } from "server/utils/server";

let server: Server;

const timeNow = "2019-07-26T17:00:00.000Z";
const previousJobRunning = 30; // Seconds since last run
const previousJobFinished = 31; // Seconds since last run

const infoLoggerSpy = vi.spyOn(logger, "info");
const errorLoggerSpy = vi.spyOn(logger, "error");

vi.mock<object>(
  import("server/utils/notificationQueue"),
  async (originalImport) => {
    const actual = await originalImport();
    return {
      ...actual,
      getGlobalNotificationQueueService: vi.fn(),
    };
  },
);

beforeAll(() => {
  vi.setSystemTime(timeNow);
});

beforeEach(async () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    eventName: EventName.TRACON,
    eventYear: "2024",
  });
  vi.spyOn(config, "server").mockReturnValue({
    ...config.server(),
    useLocalProgramFile: true,
    localKompassiFile: "program-ropecon-2025.json",
  });
  const queueService = createNotificationQueueService(
    new EmailSender(),
    1,
    true,
  );
  vi.mocked(getGlobalNotificationQueueService).mockReturnValue(queueService);

  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: randomUUID(),
  });
  await createSettings();
  await saveTestSettings({ testTime: timeNow });
  await setLatestServerStartTime();
});

afterEach(async () => {
  infoLoggerSpy.mockClear();
  errorLoggerSpy.mockClear();
  await closeServer(server);
});

describe("Progam update cronjob", () => {
  test("should run program update and set programUpdateLastRun time", async () => {
    const oldTime = subSeconds(
      new Date(timeNow),
      previousJobFinished,
    ).toISOString();
    await saveSettings({ programUpdateLastRun: oldTime });

    await autoUpdateProgramItems();

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Auto update not running, continue",
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "***** Program items auto update completed",
    );

    const settings = unsafelyUnwrap(await findOrCreateSettings());
    expect(settings.programUpdateLastRun).toEqual(timeNow);
  });

  test("should log error if program update fails", async () => {
    const oldTime = subSeconds(
      new Date(timeNow),
      previousJobFinished,
    ).toISOString();
    await saveSettings({ programUpdateLastRun: oldTime });
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValueOnce(
      makeErrorResult(KompassiError.UNKNOWN_ERROR),
    );

    await autoUpdateProgramItems();

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error(
        "***** Program items auto update failed: Loading program items from Kompassi failed",
      ),
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Program items auto update completed",
    );
  });

  test("should not start update if program update is already running", async () => {
    const oldTime = subSeconds(
      new Date(timeNow),
      previousJobRunning,
    ).toISOString();
    await saveSettings({ programUpdateLastRun: oldTime });

    await autoUpdateProgramItems();

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error("Program auto update already running, stop"),
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Program items auto update completed",
    );

    const settings = unsafelyUnwrap(await findOrCreateSettings());
    expect(settings.programUpdateLastRun).toEqual(oldTime);
  });

  test("if cronjob is run twice, should run program update only once", async () => {
    const oldTime = subSeconds(
      new Date(timeNow),
      previousJobFinished,
    ).toISOString();
    await saveSettings({ programUpdateLastRun: oldTime });

    await Promise.all([autoUpdateProgramItems(), autoUpdateProgramItems()]);

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Auto update not running, continue",
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error("Program auto update already running, stop"),
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "***** Program items auto update completed",
    );

    const settings = unsafelyUnwrap(await findOrCreateSettings());
    expect(settings.programUpdateLastRun).toEqual(timeNow);
  });

  test("should not run program update if newer server instance is started", async () => {
    const newerTime = addSeconds(new Date(timeNow), 1).toISOString();
    await saveSettings({ latestServerStartTime: newerTime });

    await autoUpdateProgramItems();

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error(
        "Cronjobs: Newer server instance running, stopping cronjobs on this instance",
      ),
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Program items auto update completed",
    );

    const settings = unsafelyUnwrap(await findOrCreateSettings());
    expect(settings.latestServerStartTime).toEqual(newerTime);
  });

  test("should not run program update and log error if stored server start time is older than this instance", async () => {
    const olderTime = subSeconds(new Date(timeNow), 1).toISOString();
    await saveSettings({ latestServerStartTime: olderTime });

    await autoUpdateProgramItems();

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error(
        `Cronjobs: Stored server start time ${olderTime} is older than this instance's start time ${timeNow}`,
      ),
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Program items auto update completed",
    );
  });
});

describe("Assignment cronjob", () => {
  test("should run assignment and set assignmentLastRun time", async () => {
    const oldTime = subSeconds(
      new Date(timeNow),
      previousJobFinished,
    ).toISOString();
    await saveSettings({ assignmentLastRun: oldTime });

    await autoAssignAttendees();

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Auto assignment not running, continue",
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "***** Automatic attendee assignment completed",
    );

    const settings = unsafelyUnwrap(await findOrCreateSettings());
    expect(settings.assignmentLastRun).toEqual(timeNow);
  });

  test("should not run assignment if assignment is already running", async () => {
    // Another run holds the in-progress lock
    await acquireAssignmentLock();

    await autoAssignAttendees();

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error("Auto assignment already running, stop"),
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Automatic attendee assignment completed",
    );
  });

  test("should reclaim a stale in-progress lock left by a crashed run", async () => {
    // A previous run acquired the lock but never released it (the process crashed). The lock is
    // older than the stale timeout, so the next run can reclaim it.
    vi.setSystemTime(
      subMinutes(new Date(timeNow), ASSIGNMENT_LOCK_STALE_TIMEOUT_MINUTES + 1),
    );
    await acquireAssignmentLock();
    vi.setSystemTime(timeNow);

    await autoAssignAttendees();

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Auto assignment not running, continue",
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "***** Automatic attendee assignment completed",
    );
  });

  test("if cronjob is run twice, should run assignment only once", async () => {
    const oldTime = subSeconds(
      new Date(timeNow),
      previousJobFinished,
    ).toISOString();
    await saveSettings({ assignmentLastRun: oldTime });

    await Promise.all([autoAssignAttendees(), autoAssignAttendees()]);

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Auto assignment not running, continue",
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error("Auto assignment already running, stop"),
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "***** Automatic attendee assignment completed",
    );

    const settings = unsafelyUnwrap(await findOrCreateSettings());
    expect(settings.assignmentLastRun).toEqual(timeNow);
  });

  test("should not run assignment if newer server instance is started", async () => {
    const newerTime = addSeconds(new Date(timeNow), 1).toISOString();
    await saveSettings({ latestServerStartTime: newerTime });

    await autoAssignAttendees();

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error(
        "Cronjobs: Newer server instance running, stopping cronjobs on this instance",
      ),
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Automatic attendee assignment completed",
    );

    const settings = unsafelyUnwrap(await findOrCreateSettings());
    expect(settings.latestServerStartTime).toEqual(newerTime);
  });

  test("should not run assignment and log error if stored server start time is older than this instance", async () => {
    const olderTime = subSeconds(new Date(timeNow), 1).toISOString();
    await saveSettings({ latestServerStartTime: olderTime });

    await autoAssignAttendees();

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error(
        `Cronjobs: Stored server start time ${olderTime} is older than this instance's start time ${timeNow}`,
      ),
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Automatic attendee assignment completed",
    );
  });
});

describe("Cronjob registration", () => {
  // Far-future schedule so the jobs never fire during the test
  const nextNewYear = "0 0 1 1 *";

  test("should start enabled cronjobs and stop them", async () => {
    vi.spyOn(config, "server").mockReturnValue({
      ...config.server(),
      autoUpdateProgramEnabled: true,
      autoAssignAttendeesEnabled: true,
      programUpdateInterval: nextNewYear,
      autoAssignInterval: nextNewYear,
    });

    await startCronJobs();

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Start cronjob: program auto update",
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Start cronjob: automatic attendee assignment",
    );

    stopCronJobs();

    expect(infoLoggerSpy).toHaveBeenCalledWith("CronJobs stopped");
  });

  test("should not start cronjobs disabled in config", async () => {
    vi.spyOn(config, "server").mockReturnValue({
      ...config.server(),
      autoUpdateProgramEnabled: false,
      autoAssignAttendeesEnabled: false,
    });

    await startCronJobs();

    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "Start cronjob: program auto update",
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "Start cronjob: automatic attendee assignment",
    );

    // startCronJobs still records this instance as the latest started one
    const settings = unsafelyUnwrap(await findOrCreateSettings());
    expect(settings.latestServerStartTime).toEqual(timeNow);
  });
});
