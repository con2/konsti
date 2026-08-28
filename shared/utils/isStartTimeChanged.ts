import { isSameStartTime } from "shared/utils/signupTimes";

export const isStartTimeChanged = (
  signedToStartTime: string,
  programItemStartTime: string,
  parentId: string,
): boolean =>
  // Reported as changed when either time is unparseable, which is what the
  // negation gives. A time that can't be read is not evidence that nothing moved,
  // and callers act on a change, so this is the answer that gets looked at rather
  // than silently passed over
  !isSameStartTime(programItemStartTime, parentId, signedToStartTime);
