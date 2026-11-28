import { randomUUID } from "node:crypto";
import { Server } from "node:http";
import {
  addMilliseconds,
  addMinutes,
  addSeconds,
  subMinutes,
  subSeconds,
} from "date-fns";
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
import { KompassiError, MongoDbError } from "shared/types/api/errors";
import { PostUpdateProgramItemsResponse } from "shared/types/api/programItems";
import { makeErrorResult } from "shared/utils/result";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { updateProgramItems } from "server/features/program-item/programItemService";
import {
  ASSIGNMENT_LOCK_STALE_TIMEOUT_MINUTES,
  acquireAssignmentLock,
  createSettings,
  findOrCreateSettings,
  getLatestServerStartTime,
  isAssignmentInProgress,
  saveSettings,
} from "server/features/settings/settingsRepository";
import { testHelperWrapper } from "server/kompassi/getProgramItemsFromKompassi";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";
import { mockNotificationQueue } from "server/test/utils/mockNotificationQueue";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import {
  autoAssignAttendees,
  autoUpdateProgramItems,
  setLatestServerStartTime,
  startCronJobs,
  stopCronJobs,
} from "server/utils/cron";
import { logger } from "server/utils/logger";
import { closeServer, startServer } from "server/utils/server";
import { sleep } from "server/utils/sleep";

let server: Server;

const timeNow = "2019-07-26T17:00:00.000Z";
const previousJobRunning = 30; // Seconds since last run
const previousJobFinished = 31; // Seconds since last run

const infoLoggerSpy = vi.spyOn(logger, "info");
const errorLoggerSpy = vi.spyOn(logger, "error");

const { mockNotificationQueueModule } = await vi.hoisted(
  () => import("server/test/utils/mockNotificationQueueModule"),
);
vi.mock(import("server/utils/notificationQueue"), mockNotificationQueueModule);

vi.mock(import("server/utils/sleep"), () => ({ sleep: vi.fn() }));

vi.mock(
  import("server/features/assignment/run-assignment/runAssignment"),
  async (importOriginal) => {
    const original = await importOriginal();
    return { ...original, runAssignment: vi.fn(original.runAssignment) };
  },
);

vi.mock(
  import("server/features/settings/settingsRepository"),
  async (importOriginal) => {
    const original = await importOriginal();
    return {
      ...original,
      getLatestServerStartTime: vi.fn(original.getLatestServerStartTime),
      acquireAssignmentLock: vi.fn(original.acquireAssignmentLock),
    };
  },
);

const databaseUnavailable = makeErrorResult(MongoDbError.UNKNOWN_ERROR);

// The clock is frozen, so a retry only moves it forward through its delay
const advanceClockOnSleep = (): void => {
  vi.mocked(sleep).mockImplementation((ms: number) => {
    vi.setSystemTime(addMilliseconds(new Date(), ms));
    return Promise.resolve();
  });
};

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
  mockNotificationQueue();

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
  vi.mocked(sleep).mockReset();
  vi.mocked(getLatestServerStartTime).mockReset();
  vi.mocked(acquireAssignmentLock).mockReset();
  vi.mocked(runAssignment).mockReset();
  vi.setSystemTime(timeNow);
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

  test("should leave the program update to the next tick while a lottery is running", async () => {
    const oldTime = subSeconds(
      new Date(timeNow),
      previousJobFinished,
    ).toISOString();
    await saveSettings({ programUpdateLastRun: oldTime });
    // A run holds the in-progress lock
    await acquireAssignmentLock();

    await autoUpdateProgramItems();

    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Lottery in progress, program update left to the next tick",
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Program items auto update completed",
    );
    expect(unsafelyUnwrap(await findProgramItems())).toEqual([]);
  });

  test("should leave a failed server instance check to the next tick", async () => {
    vi.mocked(getLatestServerStartTime).mockResolvedValueOnce(
      databaseUnavailable,
    );

    await autoUpdateProgramItems();

    // Asked once, with no retry of its own: the next tick is five minutes away
    expect(getLatestServerStartTime).toHaveBeenCalledTimes(1);
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Program items auto update completed",
    );
    expect(unsafelyUnwrap(await findProgramItems())).toEqual([]);
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
    expect(sleep).not.toHaveBeenCalled();
  });

  describe("when the database is unavailable", () => {
    const phaseGap = 15;
    const dueStartTime = (): string => {
      return addMinutes(
        new Date(timeNow),
        config.event().directSignupPhaseStart,
      ).toISOString();
    };

    beforeEach(() => {
      vi.spyOn(config, "event").mockReturnValue({
        ...config.event(),
        phaseGap,
      });
      // The real clock, which is the one that moves on between attempts
      vi.spyOn(config, "server").mockReturnValue({
        ...config.server(),
        useTestTime: false,
        autoAssignDelay: 0,
        useLocalProgramFile: true,
        localKompassiFile: "program-ropecon-2025.json",
      });
      advanceClockOnSleep();
    });

    test("should retry a failed server instance check and lottery the start time the tick was due", async () => {
      vi.mocked(getLatestServerStartTime).mockResolvedValueOnce(
        databaseUnavailable,
      );

      await autoAssignAttendees();

      expect(sleep).toHaveBeenCalledTimes(1);
      expect(infoLoggerSpy).toHaveBeenCalledWith(
        `Assigning users for program items starting at ${dueStartTime()}`,
      );
      expect(infoLoggerSpy).toHaveBeenCalledWith(
        "***** Automatic attendee assignment completed",
      );
    });

    test("should keep its lock fresh while retrying a failed run past the stale timeout", async () => {
      const { runAssignment: actualRunAssignment } = await vi.importActual<
        typeof import("server/features/assignment/run-assignment/runAssignment")
      >("server/features/assignment/run-assignment/runAssignment");
      let lockHeldOnRetry: boolean | undefined;
      vi.mocked(runAssignment)
        .mockResolvedValueOnce(databaseUnavailable)
        .mockImplementationOnce(async (params) => {
          lockHeldOnRetry = unsafelyUnwrap(await isAssignmentInProgress());
          return await actualRunAssignment(params);
        });
      // The one delay outlasts the lock taken before the first attempt
      vi.mocked(sleep).mockImplementationOnce((ms: number) => {
        vi.setSystemTime(
          addMinutes(
            addMilliseconds(new Date(), ms),
            ASSIGNMENT_LOCK_STALE_TIMEOUT_MINUTES,
          ),
        );
        return Promise.resolve();
      });

      await autoAssignAttendees();

      expect(lockHeldOnRetry).toEqual(true);
      expect(infoLoggerSpy).toHaveBeenCalledWith(
        "***** Automatic attendee assignment completed",
      );
    });

    test("should take back a lock its own attempt took when the reply was lost", async () => {
      const { acquireAssignmentLock: actualAcquireAssignmentLock } =
        await vi.importActual<
          typeof import("server/features/settings/settingsRepository")
        >("server/features/settings/settingsRepository");
      vi.mocked(acquireAssignmentLock).mockImplementationOnce(
        async (lockToken) => {
          await actualAcquireAssignmentLock(lockToken);
          return databaseUnavailable;
        },
      );

      await autoAssignAttendees();

      expect(sleep).toHaveBeenCalledTimes(1);
      expect(errorLoggerSpy).not.toHaveBeenCalledWith(
        new Error("Auto assignment already running, stop"),
      );
      expect(infoLoggerSpy).toHaveBeenCalledWith(
        "***** Automatic attendee assignment completed",
      );
    });

    test("should release a lock its lost-reply attempt took when it gives up starting", async () => {
      const { acquireAssignmentLock: actualAcquireAssignmentLock } =
        await vi.importActual<
          typeof import("server/features/settings/settingsRepository")
        >("server/features/settings/settingsRepository");
      vi.mocked(acquireAssignmentLock).mockImplementationOnce(
        async (lockToken) => {
          await actualAcquireAssignmentLock(lockToken);
          // Every later attempt fails before it reaches the lock
          vi.mocked(getLatestServerStartTime).mockResolvedValue(
            databaseUnavailable,
          );
          return databaseUnavailable;
        },
      );

      await autoAssignAttendees();

      expect(errorLoggerSpy).toHaveBeenCalledWith(
        new Error(
          `***** Auto assignment gave up on start time ${dueStartTime()}. If a lottery was due, run it manually before direct sign-up opens`,
        ),
      );
      expect(unsafelyUnwrap(await isAssignmentInProgress())).toEqual(false);
    });

    test("should not run a retry until its lock is taken again", async () => {
      const { acquireAssignmentLock: actualAcquireAssignmentLock } =
        await vi.importActual<
          typeof import("server/features/settings/settingsRepository")
        >("server/features/settings/settingsRepository");
      vi.mocked(runAssignment).mockResolvedValueOnce(databaseUnavailable);
      vi.mocked(acquireAssignmentLock)
        .mockImplementationOnce(actualAcquireAssignmentLock)
        .mockResolvedValueOnce(databaseUnavailable);

      await autoAssignAttendees();

      // The failed refresh costs a wait of its own rather than a run
      expect(sleep).toHaveBeenCalledTimes(2);
      expect(runAssignment).toHaveBeenCalledTimes(2);
      expect(infoLoggerSpy).toHaveBeenCalledWith(
        "***** Automatic attendee assignment completed",
      );
    });

    test("should keep a program update out between retries of a failed run", async () => {
      vi.mocked(runAssignment).mockResolvedValueOnce(databaseUnavailable);
      let updateDuringRetry: PostUpdateProgramItemsResponse | undefined;
      vi.mocked(sleep).mockImplementationOnce(async (ms: number) => {
        updateDuringRetry = await updateProgramItems();
        vi.setSystemTime(addMilliseconds(new Date(), ms));
      });

      await autoAssignAttendees();

      expect(updateDuringRetry).toEqual({
        message: "Lottery in progress, program items not updated",
        status: "error",
        errorId: "assignmentInProgress",
      });
      expect(infoLoggerSpy).toHaveBeenCalledWith(
        "***** Automatic attendee assignment completed",
      );
    });

    test("should retry when acquiring the assignment lock fails", async () => {
      vi.mocked(acquireAssignmentLock).mockResolvedValueOnce(
        databaseUnavailable,
      );

      await autoAssignAttendees();

      expect(sleep).toHaveBeenCalledTimes(1);
      expect(infoLoggerSpy).toHaveBeenCalledWith(
        "***** Automatic attendee assignment completed",
      );
    });

    test("should retry a run that failed and lottery the start time the tick was due", async () => {
      vi.mocked(runAssignment).mockResolvedValueOnce(databaseUnavailable);

      await autoAssignAttendees();

      expect(sleep).toHaveBeenCalledTimes(1);
      expect(infoLoggerSpy).toHaveBeenCalledWith(
        `Assigning users for program items starting at ${dueStartTime()}`,
      );
      expect(infoLoggerSpy).toHaveBeenCalledWith(
        "***** Automatic attendee assignment completed",
      );
    });

    test("should give up before direct sign-up opens and say which start time was skipped", async () => {
      vi.mocked(getLatestServerStartTime).mockResolvedValue(
        databaseUnavailable,
      );

      await autoAssignAttendees();

      // With no program update scheduled, retries run until five minutes of the phase gap are
      // left: 5, 15 and 30 seconds, then once a minute
      expect(sleep).toHaveBeenCalledTimes(12);
      expect(errorLoggerSpy).toHaveBeenCalledWith(
        new Error(
          `***** Auto assignment gave up on start time ${dueStartTime()}. If a lottery was due, run it manually before direct sign-up opens`,
        ),
      );
      expect(infoLoggerSpy).not.toHaveBeenCalledWith(
        "***** Automatic attendee assignment completed",
      );
    });

    test("should stop retrying once a newer server instance has started", async () => {
      vi.mocked(getLatestServerStartTime).mockResolvedValueOnce(
        databaseUnavailable,
      );
      const newerTime = addSeconds(new Date(timeNow), 1).toISOString();
      await saveSettings({ latestServerStartTime: newerTime });

      await autoAssignAttendees();

      expect(sleep).toHaveBeenCalledTimes(1);
      expect(errorLoggerSpy).toHaveBeenCalledWith(
        new Error(
          "Cronjobs: Newer server instance running, stopping cronjobs on this instance",
        ),
      );
      expect(infoLoggerSpy).not.toHaveBeenCalledWith(
        "***** Automatic attendee assignment completed",
      );
    });
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
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "Cronjob disabled in config: program auto update",
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "Cronjob disabled in config: automatic attendee assignment",
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
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Cronjob disabled in config: program auto update",
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Cronjob disabled in config: automatic attendee assignment",
    );

    // startCronJobs still records this instance as the latest started one
    const settings = unsafelyUnwrap(await findOrCreateSettings());
    expect(settings.latestServerStartTime).toEqual(timeNow);
  });

  test("should give up an assignment retry when the next program update is due", async () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      phaseGap: 15,
    });
    vi.spyOn(config, "server").mockReturnValue({
      ...config.server(),
      useTestTime: false,
      autoAssignDelay: 0,
      autoUpdateProgramEnabled: true,
      autoAssignAttendeesEnabled: false,
      // Five minutes after the tick
      programUpdateInterval: "5 * * * *",
    });
    await startCronJobs();
    advanceClockOnSleep();
    vi.mocked(getLatestServerStartTime).mockResolvedValue(databaseUnavailable);

    await autoAssignAttendees();
    stopCronJobs();

    // 5, 15 and 30 seconds, then once a minute until a minute before the update at five past
    expect(sleep).toHaveBeenCalledTimes(6);
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error(
        `***** Auto assignment gave up on start time ${addMinutes(new Date(timeNow), config.event().directSignupPhaseStart).toISOString()}. If a lottery was due, run it manually before direct sign-up opens`,
      ),
    );
  });

  test("should give up its start time when cronjobs stop during an attempt, and release its lock", async () => {
    vi.spyOn(config, "server").mockReturnValue({
      ...config.server(),
      autoUpdateProgramEnabled: false,
      autoAssignAttendeesEnabled: true,
      autoAssignInterval: nextNewYear,
    });
    await startCronJobs();
    vi.mocked(runAssignment).mockImplementationOnce(() => {
      stopCronJobs();
      return Promise.resolve(databaseUnavailable);
    });

    await autoAssignAttendees();

    expect(sleep).not.toHaveBeenCalled();
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error(
        `***** Auto assignment abandoned start time ${addMinutes(new Date(timeNow), config.event().directSignupPhaseStart).toISOString()} as cronjobs stopped. If a lottery was due, run it manually before direct sign-up opens`,
      ),
    );
    expect(unsafelyUnwrap(await isAssignmentInProgress())).toEqual(false);
  });

  test("should not retry a run that throws, and say which start time to run by hand", async () => {
    const runError = new Error("Thrown by the run");
    vi.mocked(runAssignment).mockRejectedValueOnce(runError);

    await autoAssignAttendees();

    expect(sleep).not.toHaveBeenCalled();
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error(
        `***** Auto assignment for start time ${addMinutes(new Date(timeNow), config.event().directSignupPhaseStart).toISOString()} threw. If a lottery was due, run it manually before direct sign-up opens`,
        { cause: runError },
      ),
    );
    expect(unsafelyUnwrap(await isAssignmentInProgress())).toEqual(false);
  });

  test("should abandon an assignment retry when cronjobs are stopped during its delay", async () => {
    vi.spyOn(config, "server").mockReturnValue({
      ...config.server(),
      autoUpdateProgramEnabled: false,
      autoAssignAttendeesEnabled: true,
      autoAssignInterval: nextNewYear,
    });
    await startCronJobs();
    vi.mocked(getLatestServerStartTime).mockResolvedValueOnce(
      databaseUnavailable,
    );
    vi.mocked(sleep).mockImplementation(() => {
      stopCronJobs();
      return Promise.resolve();
    });

    await autoAssignAttendees();

    expect(sleep).toHaveBeenCalledTimes(1);
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error(
        `***** Auto assignment abandoned start time ${addMinutes(new Date(timeNow), config.event().directSignupPhaseStart).toISOString()} as cronjobs stopped. If a lottery was due, run it manually before direct sign-up opens`,
      ),
    );
    expect(infoLoggerSpy).not.toHaveBeenCalledWith(
      "***** Automatic attendee assignment completed",
    );
  });
});
