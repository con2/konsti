import dayjs from "dayjs";
import { sharedConfig } from "shared/config/sharedConfig";

const { CONVENTION_START_TIME, PHASE_GAP } = sharedConfig;

export const testTimes = [
  // Friday
  dayjs(CONVENTION_START_TIME).subtract(5, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).subtract(1, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME)
    .subtract(1, "hours")
    .add(PHASE_GAP - 2, "minutes")
    .toISOString(),
  dayjs(CONVENTION_START_TIME)
    .subtract(1, "hours")
    .add(PHASE_GAP + 2, "minutes")
    .toISOString(),
  dayjs(CONVENTION_START_TIME).toISOString(),
  dayjs(CONVENTION_START_TIME).add(45, "minutes").toISOString(),
  dayjs(CONVENTION_START_TIME).add(1, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).add(2, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME)
    .add(2, "hours")
    .add(PHASE_GAP - 2, "minutes")
    .toISOString(),
  dayjs(CONVENTION_START_TIME).add(3, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).add(5, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).add(8, "hours").toISOString(),

  // Saturday
  dayjs(CONVENTION_START_TIME).add(10, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).add(15, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).add(16, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).add(18, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).add(24, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).add(28, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).add(32, "hours").toISOString(),

  // Sunday
  dayjs(CONVENTION_START_TIME).add(36, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).add(40, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).add(42, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).add(46, "hours").toISOString(),
  dayjs(CONVENTION_START_TIME).add(52, "hours").toISOString(),
];
