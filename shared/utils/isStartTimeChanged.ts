import { isSameMinute } from "date-fns";
import { resolveStartTime } from "shared/utils/signupTimes";

export const isStartTimeChanged = (
  signedToStartTime: string,
  programItemStartTime: string,
  parentId: string,
): boolean => {
  // A configured parent start time replaces the item's own here: the whole batch
  // is signed to that one time
  const comparedStartTime = resolveStartTime(parentId, programItemStartTime);

  // Reported as changed when either time is unparseable, which is what the
  // negation gives. A time that can't be read is not evidence that nothing moved,
  // and callers act on a change, so this is the answer that gets looked at rather
  // than silently passed over
  return !isSameMinute(
    new Date(signedToStartTime),
    new Date(comparedStartTime),
  );
};
