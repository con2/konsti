import { isSameMinute } from "date-fns";

// A direct sign-up records the hour its attendee turns up, so a batched program item's parent
// time has no part in deciding whether that hour moved
export const isStartTimeChanged = (
  signedToStartTime: string,
  programItemStartTime: string,
): boolean =>
  // Reported as changed when either time is unparseable, which is what the
  // negation gives. A time that can't be read is not evidence that nothing moved,
  // and callers act on a change, so this is the answer that gets looked at rather
  // than silently passed over
  !isSameMinute(new Date(signedToStartTime), new Date(programItemStartTime));
