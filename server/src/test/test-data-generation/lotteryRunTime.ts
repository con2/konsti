import { startOfMinute } from "date-fns";
import { ProgramItem } from "shared/types/models/programItem";
import { getProgramItemStartTime } from "shared/utils/signupTimes";

// The lottery a program item belongs to, as a value the generators can group and compare by.
// Batched program items share one lottery, so the parent override decides it. Truncated to the
// minute because a configured parent time and an item's own start time are the same moment
// written with different precision.
export const getLotteryRunTime = (programItem: ProgramItem): string =>
  startOfMinute(new Date(getProgramItemStartTime(programItem))).toISOString();
