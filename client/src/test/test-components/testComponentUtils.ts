import dayjs from "dayjs";
import { sharedConfig } from "shared/config/sharedConfig";

const { CONVENTION_START_TIME, PHASE_GAP } = sharedConfig;

export const testTimes = [
  // Friday
  dayjs(CONVENTION_START_TIME).subtract(1, "hours").format(),
  dayjs(CONVENTION_START_TIME)
    .subtract(1, "hours")
    .add(PHASE_GAP - 2, "minutes")
    .format(),
  dayjs(CONVENTION_START_TIME)
    .subtract(1, "hours")
    .add(PHASE_GAP + 2, "minutes")
    .format(),
  dayjs(CONVENTION_START_TIME).format(),
  dayjs(CONVENTION_START_TIME).add(45, "minutes").format(),
  dayjs(CONVENTION_START_TIME).add(1, "hours").format(),
  dayjs(CONVENTION_START_TIME).add(2, "hours").format(),
  dayjs(CONVENTION_START_TIME).add(3, "hours").format(),
  dayjs(CONVENTION_START_TIME).add(5, "hours").format(),
  dayjs(CONVENTION_START_TIME).add(8, "hours").format(),
  dayjs(CONVENTION_START_TIME).add(10, "hours").format(),

  // Saturday
  dayjs(CONVENTION_START_TIME).add(15, "hours").format(),
  dayjs(CONVENTION_START_TIME).add(16, "hours").format(),
  dayjs(CONVENTION_START_TIME).add(24, "hours").format(),
  dayjs(CONVENTION_START_TIME).add(28, "hours").format(),
  dayjs(CONVENTION_START_TIME).add(32, "hours").format(),

  // Sunday
  dayjs(CONVENTION_START_TIME).add(36, "hours").format(),
  dayjs(CONVENTION_START_TIME).add(40, "hours").format(),
  dayjs(CONVENTION_START_TIME).add(42, "hours").format(),
  dayjs(CONVENTION_START_TIME).add(46, "hours").format(),
  dayjs(CONVENTION_START_TIME).add(52, "hours").format(),
];
