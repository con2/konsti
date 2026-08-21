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

  // Reported as changed when either time is unparseable, which is what the
  // negation gives: a changed sign-up is subtracted from the lottery's remaining
  // capacity, so this holds the seat of someone who already has one. Reporting
  // unchanged instead would leave that seat available and overbook the item
  return !isSameMinute(
    new Date(signedToStartTime),
    new Date(comparedStartTime),
  );
};
