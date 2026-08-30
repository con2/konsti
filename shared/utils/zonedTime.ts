import { TZDate } from "@date-fns/tz";
import { TIMEZONE } from "shared/utils/timezone";

const HOUR_MS = 60 * 60 * 1000;

// Whether an instant lands on exactly this wall-clock hour in the event timezone.
// Converting a known instant into a timezone is unambiguous, so this is the same
// answer on every host.
const rendersAtWallClockHour = (
  instant: Date,
  year: number,
  month: number,
  day: number,
  hour: number,
): boolean => {
  const zoned = new TZDate(instant, TIMEZONE);
  return (
    zoned.getFullYear() === year &&
    zoned.getMonth() === month &&
    zoned.getDate() === day &&
    zoned.getHours() === hour
  );
};

// The instant at a given wall-clock hour in the event timezone.
//
// The hour the autumn transition repeats occurs twice, and which of the two the
// TZDate constructor lands on depends on the host's own timezone - so a UTC
// server and a Finnish browser would disagree by an hour about the same
// configured time. The first occurrence is picked explicitly here, which is the
// same answer everywhere.
//
// The hour the spring transition skips does not exist at all; that resolves
// forward, to the same instant the wall clock an hour later would give.
export const atWallClockHourInEventTimezone = (
  year: number,
  month: number,
  day: number,
  hour: number,
): Date => {
  const candidate = new TZDate(year, month, day, hour, 0, 0, TIMEZONE);
  const hourEarlier = new Date(candidate.getTime() - HOUR_MS);

  // Rendering the same wall clock an hour earlier means the constructor landed
  // on the second occurrence of a repeated hour
  return rendersAtWallClockHour(hourEarlier, year, month, day, hour)
    ? hourEarlier
    : new Date(candidate);
};
