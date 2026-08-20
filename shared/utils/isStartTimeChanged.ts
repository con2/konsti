import { isSameMinute } from "date-fns";
import { config } from "shared/config";

export const isStartTimeChanged = (
  signedToStartTime: string,
  programItemStartTime: string,
  parentId: string,
): boolean => {
  const { startTimesByParentIds } = config.event();

  // A configured parent start time replaces the item's own here: the whole batch
  // is signed to that one time
  const comparedStartTime =
    startTimesByParentIds.get(parentId) ?? programItemStartTime;

  return !isSameMinute(
    new Date(signedToStartTime),
    new Date(comparedStartTime),
  );
};
