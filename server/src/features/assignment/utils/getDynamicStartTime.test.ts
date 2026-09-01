import { randomUUID } from "node:crypto";
import { addHours, addMinutes, addSeconds, subMinutes } from "date-fns";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test } from "vitest";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  getDirectSignupStartTime,
  getLotterySignupEndTime,
} from "shared/utils/signupTimes";
import { db } from "server/db/mongodb";
import { getDynamicStartTime } from "server/features/assignment/utils/getDynamicStartTime";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

// Far enough into the event that its direct sign-up time is not clamped to the event start
const programItemStartTime = addHours(
  new Date(config.event().eventStartTime),
  8,
).toISOString();

const lotterySignupClosesAt = (): Date =>
  subMinutes(
    new Date(programItemStartTime),
    config.event().directSignupPhaseStart,
  );

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
});

afterEach(async () => {
  await mongoose.disconnect();
});

// The cron job passes no start time of its own, so this is what decides which starting time each
// tick lotteries - and with it that a run begins as lottery sign-up closes, leaving the phase gap
// as the time it has to finish in.
test("targets the starting time whose lottery sign-up closes now", async () => {
  await saveTestSettings({ testTime: lotterySignupClosesAt().toISOString() });

  const startTime = unsafelyUnwrap(await getDynamicStartTime());

  expect(startTime).toEqual(programItemStartTime);
});

test("leaves the phase gap between the run and direct sign-up opening", async () => {
  const timeNow = lotterySignupClosesAt();
  await saveTestSettings({ testTime: timeNow.toISOString() });

  const startTime = unsafelyUnwrap(await getDynamicStartTime());
  const programItem = { ...testProgramItem, startTime };

  expect(getLotterySignupEndTime(programItem)).toEqual(timeNow);
  expect(getDirectSignupStartTime(programItem)).toEqual(
    addMinutes(timeNow, config.event().phaseGap),
  );
});

// A tick arriving part-way through the minute still has to name a whole starting time
test("drops the seconds of the current time", async () => {
  const timeNow = addSeconds(lotterySignupClosesAt(), 30);
  await saveTestSettings({ testTime: timeNow.toISOString() });

  const startTime = unsafelyUnwrap(await getDynamicStartTime());

  expect(startTime).toEqual(programItemStartTime);
});
