import { isSameStartTime } from "shared/utils/signupTimes";

// A parent start time batches several items into one lottery, so it is what the sign-up was
// made against
export const isStartTimeMatch = (
  startTime: string,
  timeToMatch: string,
  parentId: string | undefined,
): boolean => isSameStartTime(startTime, parentId, timeToMatch);
