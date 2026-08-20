import { isSameMinute } from "date-fns";
import { config } from "shared/config";

export const isStartTimeMatch = (
  startTime: string,
  timeToMatch: string,
  parentId: string | undefined,
): boolean => {
  const { startTimesByParentIds } = config.event();

  const startTimeMatch = isSameMinute(
    new Date(startTime),
    new Date(timeToMatch),
  );

  if (!parentId) {
    return startTimeMatch;
  }

  const parentStartTime = startTimesByParentIds.get(parentId);

  // A parent start time batches several items into one lottery, so it is what
  // the sign-up was made against
  return parentStartTime === undefined
    ? startTimeMatch
    : isSameMinute(new Date(parentStartTime), new Date(timeToMatch));
};
