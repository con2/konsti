import { isAfter, isBefore, startOfMinute } from "date-fns";

// Comparisons that read awkwardly as negations at the call site, and the two
// bounded-range checks whose exact edge behaviour matters

export const isSameOrAfter = (time: Date, compared: Date): boolean =>
  !isBefore(time, compared);

export const isSameOrBefore = (time: Date, compared: Date): boolean =>
  !isAfter(time, compared);

// Whole-minute comparison including the start and excluding the end, so a
// program item starting exactly at a sign-up window's close belongs to the next
// window rather than to both
export const isWithinMinutes = (
  time: Date,
  start: Date,
  end: Date,
): boolean => {
  const minute = startOfMinute(time);
  return (
    !isBefore(minute, startOfMinute(start)) &&
    isBefore(minute, startOfMinute(end))
  );
};

export const isBetweenExclusive = (
  time: Date,
  start: Date,
  end: Date,
): boolean => isAfter(time, start) && isBefore(time, end);
