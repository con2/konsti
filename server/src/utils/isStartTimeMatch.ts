import { isSameMinute } from "date-fns";
import { resolveStartTime } from "shared/utils/signupTimes";

export const isStartTimeMatch = (
  startTime: string,
  timeToMatch: string,
  parentId: string | undefined,
): boolean => {
  // A parent start time batches several items into one lottery, so it is what
  // the sign-up was made against
  const comparedStartTime = resolveStartTime(parentId, startTime);

  return isSameMinute(new Date(comparedStartTime), new Date(timeToMatch));
};
