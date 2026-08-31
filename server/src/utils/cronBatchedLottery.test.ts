import { randomUUID } from "node:crypto";
import { subMinutes } from "date-fns";
import mongoose from "mongoose";
import { sortBy, unique } from "remeda";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { eventConfig } from "shared/config/eventConfig";
import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignup } from "shared/types/models/user";
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
} from "server/features/settings/settingsRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUsers } from "server/features/user/userRepository";
import { createIndividualUsers } from "server/test/test-data-generation/generators/createUsers";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";
import { seedRandomness } from "server/test/utils/seedRandomness";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { startCronJobs, stopCronJobs } from "server/utils/cron";
import {
  createNotificationQueueService,
  getGlobalNotificationQueueService,
} from "server/utils/notificationQueue";

// The batch under test is the live event's own first one, and its sub-sessions come from the
// event's Kompassi dump rather than from a fixture: the cron picking the right start time is
// exactly what a parent hour that does not line up with its slots would break
const [batchParentId, batchStartTime] = [
  ...eventConfig.startTimesByParentIds,
][0];

const attendeeCount = 18;

// Croner schedules off the real clock, so this file must not freeze it the way the other cron
// tests do: a frozen date leaves the job waiting out the delay to the next real tick. The
// seconds field croner takes as a sixth value is what keeps that wait short.
const everySecond = "* * * * * *";

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

  // The live event config, not the stub the shared test setup applies: the batch under test is
  // this event's own, and only here do its parent hours line up with the dump's sub-sessions
  vi.spyOn(config, "event").mockReturnValue(eventConfig);
  vi.spyOn(config, "server").mockReturnValue({
    ...config.server(),
    useLocalProgramFile: true,
    localKompassiFile: "program-tracon-2026.json",
    autoUpdateProgramEnabled: false,
    autoAssignAttendeesEnabled: true,
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
const waitForCronRun = async (): Promise<void> => {
  await vi.waitFor(
    async () => {
      const settings = unsafelyUnwrap(await findOrCreateSettings());
      expect(new Date(settings.assignmentLastRun).getTime()).toBeGreaterThan(0);
    },
    { timeout: 30_000, interval: 100 },
  );
  stopCronJobs();
};

const seedBatchAndRunCron = async (minutesLate = 0): Promise<ProgramItem[]> => {
  await loadEventProgram();
  const slots = await getBatchSlots();
  await seedAttendees(slots);
  await setClockBeforeBatchLottery(minutesLate);

  await startCronJobs();
  await waitForCronRun();

  return slots;
};

test("Assignment cronjob should lottery a batch across its own starting times", async () => {
  const slots = await seedBatchAndRunCron();

  const filledSlots = unsafelyUnwrap(await findDirectSignups()).filter(
    (directSignup) => directSignup.count > 0,
  );
  const slotsById = new Map(slots.map((slot) => [slot.programItemId, slot]));

  // A tick keyed on the parent hour placed attendees at more than one of the batch's own hours
  const placedStartTimes = unique(
    filledSlots.map(
      (directSignup) => slotsById.get(directSignup.programItemId)?.startTime,
    ),
  );
  expect(placedStartTimes.length).toBeGreaterThan(1);
  expect(placedStartTimes).not.toContain(undefined);

  // A spot is recorded at the hour the attendee turns up, never at the hour the lottery ran
  for (const directSignup of filledSlots) {
    for (const userSignup of directSignup.userSignups) {
      expect(userSignup.signedToStartTime).toEqual(
        slotsById.get(directSignup.programItemId)?.startTime,
      );
    }
  }

  // Nobody was left out: the batch's real slots hold far more than were seeded
  const placedCount = filledSlots.reduce(
    (total, directSignup) => total + directSignup.count,
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

test("Assignment cronjob should close each lotteried slot against its own start time", async () => {
  await seedBatchAndRunCron();

  for (const slot of await getBatchSlots()) {
    expect(slot.lotteryRanForStartTime).toEqual(slot.startTime);
  }
});

test("Assignment cronjob should leave the event's other batches alone", async () => {
  await seedBatchAndRunCron();

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

test("Assignment cronjob should lottery nothing when the clock misses the batch", async () => {
  // An hour past the moment the batch's own lottery is due
  await seedBatchAndRunCron(60);

  const filledSlots = unsafelyUnwrap(await findDirectSignups()).filter(
    (directSignup) => directSignup.count > 0,
  );
  expect(filledSlots).toEqual([]);

  for (const programItem of unsafelyUnwrap(await findProgramItems())) {
    expect(programItem.lotteryRanForStartTime).toBeUndefined();
  }
});
