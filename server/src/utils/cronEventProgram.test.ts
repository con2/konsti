import { randomUUID } from "node:crypto";
import { subMinutes } from "date-fns";
import mongoose from "mongoose";
import { sortBy, unique } from "remeda";
import {
  MockInstance,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { config } from "shared/config";
import { eventConfig } from "shared/config/eventConfig";
import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignup } from "shared/types/models/user";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { db } from "server/db/mongodb";
import {
  assertAssignmentInvariants,
  assertUserUpdatedCorrectly,
  verifyUserSignups,
} from "server/features/assignment/run-assignment/runAssignmentTestUtils";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { EmailSender } from "server/features/notifications/email";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { updateProgramItems } from "server/features/program-item/programItemService";
import {
  createSettings,
  findOrCreateSettings,
  saveSettings,
} from "server/features/settings/settingsRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUsers } from "server/features/user/userRepository";
import { createIndividualUsers } from "server/test/test-data-generation/generators/createUsers";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";
import { seedRandomness } from "server/test/utils/seedRandomness";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { startCronJobs, stopCronJobs } from "server/utils/cron";
import { logger } from "server/utils/logger";
import {
  createNotificationQueueService,
  getGlobalNotificationQueueService,
} from "server/utils/notificationQueue";

// Both jobs run here against the live event config and the event's own Kompassi dump rather
// than fixtures, because that is where the two can disagree: a parent hour that stopped lining
// up with its sub-sessions, or a renamed slug, leaves each of them individually correct.

// The batch under test is the event's own first one
const [batchParentId, batchStartTime] = [
  ...eventConfig.startTimesByParentIds,
][0];

const attendeeCount = 18;

// Croner schedules off the real clock, so this file must not freeze it the way the other cron
// tests do: a frozen date leaves a job waiting out the delay to the next real tick. The seconds
// field croner takes as a sixth value is what keeps that wait short.
const everySecond = "* * * * * *";

// Re-established per test because the shared restore between them detaches it
let infoLoggerSpy: MockInstance;

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

beforeEach(async () => {
  seedRandomness();
  infoLoggerSpy = vi.spyOn(logger, "info");

  // The live event config, not the stub the shared test setup applies: the batch under test is
  // this event's own, and only here do its parent hours line up with the dump's sub-sessions
  vi.spyOn(config, "event").mockReturnValue(eventConfig);
  vi.spyOn(config, "server").mockReturnValue({
    ...config.server(),
    useLocalProgramFile: true,
    localKompassiFile: "program-tracon-2026.json",
    autoUpdateProgramEnabled: false,
    autoAssignAttendeesEnabled: false,
    programUpdateInterval: everySecond,
    autoAssignInterval: everySecond,
    autoAssignDelay: 0,
    useTestTime: true,
  });

  vi.mocked(getGlobalNotificationQueueService).mockReturnValue(
    createNotificationQueueService(new EmailSender(), 1, true),
  );

  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
  await createSettings();
});

afterEach(async () => {
  // Before the config stub is restored, so a failed assertion cannot leave a job firing every
  // second against the next test's database
  stopCronJobs();
  vi.restoreAllMocks();
  await mongoose.disconnect();
});

// Registration reads the config once, so each test switches on only the job it drives - the
// other one ticking every second alongside would re-import the program mid-lottery
const startJob = async (job: "programUpdate" | "assignment"): Promise<void> => {
  vi.spyOn(config, "server").mockReturnValue({
    ...config.server(),
    autoUpdateProgramEnabled: job === "programUpdate",
    autoAssignAttendeesEnabled: job === "assignment",
  });
  await startCronJobs();
};

// Read the program through the import the program update runs, so the batch has the shape and
// the capacities the event will actually have
const loadEventProgram = async (): Promise<void> => {
  const updateResult = await updateProgramItems();
  expect(updateResult.status).toEqual("success");
};

const getBatchSlots = async (): Promise<ProgramItem[]> => {
  const programItems = unsafelyUnwrap(await findProgramItems());
  return sortBy(
    programItems.filter(
      (programItem) => programItem.parentId === batchParentId,
    ),
    (programItem) => programItem.startTime,
  );
};

// Rotate each attendee's first preference over the batch's slots. The real slots hold ninety
// each, so no capacity forces a spread - the preferences are what make one run place people at
// several starting times, which is what a batch is for.
const seedAttendees = async (slots: ProgramItem[]): Promise<void> => {
  await createIndividualUsers(attendeeCount);

  const users = unsafelyUnwrap(await findUsers());
  for (const [index, user] of users.entries()) {
    const lotterySignups: LotterySignup[] = [0, 1, 2].map((offset) => {
      const slot = slots[(index + offset) % slots.length];
      return {
        programItemId: slot.programItemId,
        priority: offset + 1,
        signedToStartTime: slot.startTime,
      };
    });
    await saveLotterySignups({ username: user.username, lotterySignups });
  }
};

// The cron derives its own start time from the clock, so this is what aims a tick at the batch
const setClockBeforeBatchLottery = async (minutesLate = 0): Promise<void> => {
  await saveTestSettings({
    testTime: subMinutes(
      new Date(batchStartTime),
      config.event().directSignupPhaseStart - minutesLate,
    ).toISOString(),
  });
};

// Epoch means no assignment has run yet, so any later time is the tick having finished
const waitForAssignmentRun = async (): Promise<void> => {
  await vi.waitFor(
    async () => {
      const settings = unsafelyUnwrap(await findOrCreateSettings());
      expect(new Date(settings.assignmentLastRun).getTime()).toBeGreaterThan(0);
    },
    { timeout: 30_000, interval: 100 },
  );
  stopCronJobs();
};

// A fresh settings row records the update as having just run, and a tick within thirty seconds
// of the last one is refused as one still in flight, so the mark goes back before the job starts.
// The completion log is what says the import finished: unlike the assignment's last-run time,
// the update's is its concurrency guard and is written before the import rather than after.
const runProgramUpdateJob = async (): Promise<void> => {
  await saveSettings({ programUpdateLastRun: new Date(0).toISOString() });

  infoLoggerSpy.mockClear();
  await startJob("programUpdate");
  await vi.waitFor(
    () => {
      expect(infoLoggerSpy).toHaveBeenCalledWith(
        "***** Program items auto update completed",
      );
    },
    { timeout: 30_000, interval: 100 },
  );
  stopCronJobs();
};

const seedBatchAndRunLotteryJob = async (
  minutesLate = 0,
): Promise<ProgramItem[]> => {
  await loadEventProgram();
  const slots = await getBatchSlots();
  await seedAttendees(slots);
  await setClockBeforeBatchLottery(minutesLate);

  await startJob("assignment");
  await waitForAssignmentRun();

  return slots;
};

const getFilledSlots = async (): Promise<
  { programItemId: string; count: number }[]
> => {
  const directSignups = unsafelyUnwrap(await findDirectSignups());
  return directSignups
    .filter((directSignup) => directSignup.count > 0)
    .map((directSignup) => ({
      programItemId: directSignup.programItemId,
      count: directSignup.count,
    }));
};

describe("Program update cronjob", () => {
  test("should import the event's program on its own schedule", async () => {
    await runProgramUpdateJob();

    const programItems = unsafelyUnwrap(await findProgramItems());
    expect(programItems.length).toBeGreaterThan(0);
  });

  test("should import every batch the event config names, with the sub-sessions that make it one", async () => {
    await runProgramUpdateJob();

    const programItems = unsafelyUnwrap(await findProgramItems());
    for (const parentId of config.event().startTimesByParentIds.keys()) {
      const slots = programItems.filter(
        (programItem) => programItem.parentId === parentId,
      );
      // More than one, or the parent hour has nothing to batch and the config entry is dead
      expect(slots.length).toBeGreaterThan(1);
      // The lottery only picks up program items it is allowed to lottery
      expect(slots.every(isLotterySignupProgramItem)).toBe(true);
    }
  });

  test("should not clear a lotteried start time when it re-imports the program", async () => {
    const slots = await seedBatchAndRunLotteryJob();
    const filledSlotsBefore = await getFilledSlots();

    await runProgramUpdateJob();

    for (const slot of await getBatchSlots()) {
      expect(slot.lotteryRanForStartTime).toEqual(slot.startTime);
    }
    expect(await getFilledSlots()).toEqual(filledSlotsBefore);
    // The import found the same program, so nothing was rescheduled out of the batch
    expect((await getBatchSlots()).length).toEqual(slots.length);
  });
});

describe("Assignment cronjob", () => {
  test("should lottery a batch across its own starting times", async () => {
    const slots = await seedBatchAndRunLotteryJob();

    const filledSlots = await getFilledSlots();
    const slotsById = new Map(slots.map((slot) => [slot.programItemId, slot]));

    // A tick keyed on the parent hour placed attendees at more than one of the batch's own hours
    const placedStartTimes = unique(
      filledSlots.map((slot) => slotsById.get(slot.programItemId)?.startTime),
    );
    expect(placedStartTimes.length).toBeGreaterThan(1);
    expect(placedStartTimes).not.toContain(undefined);

    // A spot is recorded at the hour the attendee turns up, never at the hour the lottery ran
    for (const directSignup of unsafelyUnwrap(await findDirectSignups())) {
      for (const userSignup of directSignup.userSignups) {
        expect(userSignup.signedToStartTime).toEqual(
          slotsById.get(directSignup.programItemId)?.startTime,
        );
      }
    }

    // Nobody was left out: the batch's real slots hold far more than were seeded
    const placedCount = filledSlots.reduce(
      (total, slot) => total + slot.count,
      0,
    );
    expect(placedCount).toEqual(attendeeCount);

    // Everybody got something they had ranked, and heard about it once
    unsafelyUnwrap(await verifyUserSignups());
    await assertUserUpdatedCorrectly(
      unsafelyUnwrap(await findUsers()).map((user) => user.username),
    );
    await assertAssignmentInvariants(batchStartTime);
  });

  test("should close each lotteried slot against its own start time", async () => {
    await seedBatchAndRunLotteryJob();

    for (const slot of await getBatchSlots()) {
      expect(slot.lotteryRanForStartTime).toEqual(slot.startTime);
    }
  });

  test("should leave the event's other batches alone", async () => {
    await seedBatchAndRunLotteryJob();

    const otherBatchIds = new Set(
      [...config.event().startTimesByParentIds.keys()].filter(
        (parentId) => parentId !== batchParentId,
      ),
    );
    const otherSlots = unsafelyUnwrap(await findProgramItems()).filter(
      (programItem) => otherBatchIds.has(programItem.parentId),
    );

    expect(otherSlots.length).toBeGreaterThan(0);
    for (const slot of otherSlots) {
      expect(slot.lotteryRanForStartTime).toBeUndefined();
    }
  });

  test("should lottery nothing when the clock misses the batch", async () => {
    // An hour past the moment the batch's own lottery is due
    await seedBatchAndRunLotteryJob(60);

    expect(await getFilledSlots()).toEqual([]);

    for (const programItem of unsafelyUnwrap(await findProgramItems())) {
      expect(programItem.lotteryRanForStartTime).toBeUndefined();
    }
  });
});
