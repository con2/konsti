import { isAfter, isBefore, isSameMinute, startOfMinute } from "date-fns";

// Comparisons date-fns has no direct equivalent for, and the two bounded-range
// checks whose exact edge behaviour matters.
//
// Compared as timestamps rather than as !isBefore / !isAfter: a negated
// comparison is true whenever either side is an invalid date, so a single
// unparseable time would turn every sign-up gate from closed to open. NaN
// compares false against everything, which keeps them closed

// Program item start times are compared to the minute throughout: the same moment can be
// written two ways, since a configured time carries no milliseconds and a stored one always
// does. Invalid on either side is false, like the comparisons above
export const isSameTime = (time: string, compared: string): boolean =>
  isSameMinute(new Date(time), new Date(compared));

export const isSameOrAfter = (time: Date, compared: Date): boolean =>
  time.getTime() >= compared.getTime();

export const isSameOrBefore = (time: Date, compared: Date): boolean =>
  time.getTime() <= compared.getTime();

// Whole-minute comparison including the start and excluding the end, so a
// program item starting exactly at a sign-up window's close belongs to the next
// window rather than to both
export const isWithinMinutes = (
  time: Date,
  start: Date,
  end: Date,
): boolean => {
  const minute = startOfMinute(time).getTime();
  return (
    minute >= startOfMinute(start).getTime() &&
    minute < startOfMinute(end).getTime()
  );
};

export const isBetweenExclusive = (
  time: Date,
  start: Date,
  end: Date,
): boolean => isAfter(time, start) && isBefore(time, end);
