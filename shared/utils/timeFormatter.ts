import { tz } from "@date-fns/tz";
import { format, formatDistance } from "date-fns";
import { Locale } from "shared/types/locale";
import { getCurrentLocale, localeFor } from "shared/utils/setLocale";
import { TIMEZONE } from "shared/utils/timezone";

// date-fns formatting is only called here to make sure all client times use the
// correct timezone and the active locale

// No number: a bare number is a valid argument to date-fns format but is almost
// always a duration rather than an instant, and renders as a plausible wrong
// clock time (120 becomes "02:00") instead of failing
type Time = Date | string;

const formatInEventTimezone = (time: Time, pattern: string): string =>
  format(time, pattern, { in: tz(TIMEZONE), locale: getCurrentLocale() });

export const getWeekdayAndTime = (time: Time): string =>
  formatInEventTimezone(time, "cccc HH:mm");

export const getDate = (time: Time): string =>
  formatInEventTimezone(time, "d.M.yyyy");

export const getShortDate = (time: Time): string =>
  formatInEventTimezone(time, "ccc d.M.");

export const getTime = (time: Time): string =>
  formatInEventTimezone(time, "HH:mm");

export const getShortWeekdayAndTime = (time: Time): string =>
  formatInEventTimezone(time, "ccc HH:mm");

export const getTimezone = (time: Time): string =>
  formatInEventTimezone(time, "zzz");

export const getDateAndTime = (time: Time): string =>
  formatInEventTimezone(time, "ccc d.M.yyyy HH:mm");

export const getDateAndTimeWithLocale = (time: Time, locale: Locale): string =>
  format(time, "ccc d.M.yyyy HH:mm", {
    in: tz(TIMEZONE),
    locale: localeFor(locale),
  });

// Deliberately the viewer's own timezone rather than the event's: these answer
// "what time is it where you are", next to the Finnish time in the same text.
// Only the timezone is local - the weekday still follows the UI language
export const getLocalDateAndTime = (time: Time): string =>
  format(time, "ccc d.M.yyyy HH:mm", { locale: getCurrentLocale() });

export const getLocalTimezone = (time: Time): string =>
  format(time, "zzz", { locale: getCurrentLocale() });

export const formatProgramItemDuration = (mins: number): string => {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;

  const hoursStr = hours === 0 ? "" : `${hours} h`;
  const minutesStr = minutes === 0 ? "" : `${minutes} min`;

  return `${hoursStr} ${minutesStr}`;
};

export const formattedCurrentTime = (currentTime: Date): string =>
  formatInEventTimezone(currentTime, "HH:mm:ss");

// Describes `to` relative to `from`, e.g. "2 minutes ago" or "in an hour"
export const formatRelativeTime = (from: Date, to: Date): string =>
  formatDistance(to, from, { addSuffix: true, locale: getCurrentLocale() });
