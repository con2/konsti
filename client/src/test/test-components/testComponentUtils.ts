import dayjs from "dayjs";
import { config } from "shared/config";

const { eventStartTime, phaseGap } = config.event();

export const testTimes = [
  // Before event
  dayjs(eventStartTime).subtract(3, "weeks").toISOString(),
  dayjs(eventStartTime).subtract(2, "weeks").toISOString(),
  dayjs(eventStartTime).subtract(1, "weeks").toISOString(),
  // Friday
  dayjs(eventStartTime).subtract(5, "hours").toISOString(),
  dayjs(eventStartTime).subtract(1, "hours").toISOString(),
  dayjs(eventStartTime)
    .subtract(1, "hours")
    .add(phaseGap - 2, "minutes")
    .toISOString(),
  dayjs(eventStartTime).toISOString(),
  dayjs(eventStartTime).add(45, "minutes").toISOString(),
  dayjs(eventStartTime).add(1, "hours").toISOString(),
  dayjs(eventStartTime).add(1, "hours").add(1, "minute").toISOString(),
  dayjs(eventStartTime).add(1, "hours").add(5, "minute").toISOString(),
  dayjs(eventStartTime).add(2, "hours").toISOString(),
  dayjs(eventStartTime)
    .add(2, "hours")
    .add(phaseGap - 2, "minutes")
    .toISOString(),
  dayjs(eventStartTime)
    .add(2, "hours")
    .add(phaseGap + 2, "minutes")
    .toISOString(),
  dayjs(eventStartTime).add(3, "hours").toISOString(),
  dayjs(eventStartTime).add(5, "hours").toISOString(),
  dayjs(eventStartTime).add(6, "hours").toISOString(),
  dayjs(eventStartTime).add(6, "hours").add(3, "minute").toISOString(),
  dayjs(eventStartTime).add(8, "hours").toISOString(),

  // Saturday
  dayjs(eventStartTime).add(10, "hours").toISOString(),
  dayjs(eventStartTime).add(15, "hours").toISOString(),
  dayjs(eventStartTime).add(16, "hours").toISOString(),
  dayjs(eventStartTime).add(18, "hours").toISOString(),
  dayjs(eventStartTime).add(24, "hours").toISOString(),
  dayjs(eventStartTime).add(28, "hours").toISOString(),
  dayjs(eventStartTime).add(32, "hours").toISOString(),

  // Sunday
  dayjs(eventStartTime).add(36, "hours").toISOString(),
  dayjs(eventStartTime).add(40, "hours").toISOString(),
  dayjs(eventStartTime).add(42, "hours").toISOString(),
  dayjs(eventStartTime).add(46, "hours").toISOString(),
  dayjs(eventStartTime).add(52, "hours").toISOString(),

  // Time now
  dayjs().toISOString(),
];
