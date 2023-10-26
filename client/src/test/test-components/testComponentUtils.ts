import dayjs from "dayjs";
import { config } from "shared/config";

const { conventionStartTime, PHASE_GAP } = config.shared();

export const testTimes = [
  // Friday
  dayjs(conventionStartTime).subtract(5, "hours").toISOString(),
  dayjs(conventionStartTime).subtract(1, "hours").toISOString(),
  dayjs(conventionStartTime)
    .subtract(1, "hours")
    .add(PHASE_GAP - 2, "minutes")
    .toISOString(),
  dayjs(conventionStartTime).toISOString(),
  dayjs(conventionStartTime).add(45, "minutes").toISOString(),
  dayjs(conventionStartTime).add(1, "hours").toISOString(),
  dayjs(conventionStartTime).add(2, "hours").toISOString(),
  dayjs(conventionStartTime)
    .add(2, "hours")
    .add(PHASE_GAP - 2, "minutes")
    .toISOString(),
  dayjs(conventionStartTime)
    .add(2, "hours")
    .add(PHASE_GAP + 2, "minutes")
    .toISOString(),
  dayjs(conventionStartTime).add(3, "hours").toISOString(),
  dayjs(conventionStartTime).add(5, "hours").toISOString(),
  dayjs(conventionStartTime).add(8, "hours").toISOString(),

  // Saturday
  dayjs(conventionStartTime).add(10, "hours").toISOString(),
  dayjs(conventionStartTime).add(15, "hours").toISOString(),
  dayjs(conventionStartTime).add(16, "hours").toISOString(),
  dayjs(conventionStartTime).add(18, "hours").toISOString(),
  dayjs(conventionStartTime).add(24, "hours").toISOString(),
  dayjs(conventionStartTime).add(28, "hours").toISOString(),
  dayjs(conventionStartTime).add(32, "hours").toISOString(),

  // Sunday
  dayjs(conventionStartTime).add(36, "hours").toISOString(),
  dayjs(conventionStartTime).add(40, "hours").toISOString(),
  dayjs(conventionStartTime).add(42, "hours").toISOString(),
  dayjs(conventionStartTime).add(46, "hours").toISOString(),
  dayjs(conventionStartTime).add(52, "hours").toISOString(),
];
