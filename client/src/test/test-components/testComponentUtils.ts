import moment from "moment";
import { sharedConfig } from "shared/config/sharedConfig";

const { CONVENTION_START_TIME, PHASE_GAP } = sharedConfig;

export const testTimes = [
  moment(CONVENTION_START_TIME).subtract(2, "hours").format(),
  moment(CONVENTION_START_TIME).format(),
  moment(CONVENTION_START_TIME)
    .add(PHASE_GAP - 2, "minutes")
    .format(),
  moment(CONVENTION_START_TIME)
    .add(PHASE_GAP + 2, "minutes")
    .format(),
  moment(CONVENTION_START_TIME).add(45, "minutes").format(),
  moment(CONVENTION_START_TIME).add(1, "hours").add(45, "minutes").format(),
  moment(CONVENTION_START_TIME).add(2, "hours").add(45, "minutes").format(),
  moment(CONVENTION_START_TIME).add(3, "hours").add(45, "minutes").format(),
  moment(CONVENTION_START_TIME).add(5, "hours").add(45, "minutes").format(),
  moment(CONVENTION_START_TIME).add(15, "hours").add(45, "minutes").format(),
  moment(CONVENTION_START_TIME).add(16, "hours").add(45, "minutes").format(),
  moment(CONVENTION_START_TIME).add(24, "hours").add(45, "minutes").format(),
  moment(CONVENTION_START_TIME).add(28, "hours").add(45, "minutes").format(),
  moment(CONVENTION_START_TIME).add(36, "hours").add(45, "minutes").format(),
  moment(CONVENTION_START_TIME).add(40, "hours").add(45, "minutes").format(),
];
