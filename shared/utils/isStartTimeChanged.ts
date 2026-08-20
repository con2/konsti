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

  // Reported as unchanged when either time is unparseable, rather than as
  // changed: a "changed" sign-up is subtracted from the lottery's remaining
  // capacity, so failing the other way would silently withhold spots
  return !isSameMinuteOrUnparseable(
    new Date(signedToStartTime),
    new Date(comparedStartTime),
  );
};

const isSameMinuteOrUnparseable = (time: Date, compared: Date): boolean =>
  Number.isNaN(time.getTime()) ||
  Number.isNaN(compared.getTime()) ||
  isSameMinute(time, compared);
