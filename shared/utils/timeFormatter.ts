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

// Every formatter takes the language to render in. A component must pass the
// one it read through the locale hook: the active language otherwise lives in
// module state, which React cannot see, so a memoized weekday would keep
// rendering in the language it was first formatted in. Omitting it falls back to
// that module state, which is what non-rendering callers want
const resolveLocale = (locale?: Locale): ReturnType<typeof getCurrentLocale> =>
  locale === undefined ? getCurrentLocale() : localeFor(locale);

const formatInEventTimezone = (
  time: Time,
  pattern: string,
  locale?: Locale,
): string =>
  format(time, pattern, { in: tz(TIMEZONE), locale: resolveLocale(locale) });

export const getWeekdayAndTime = (time: Time, locale?: Locale): string =>
  formatInEventTimezone(time, "cccc HH:mm", locale);

export const getDate = (time: Time, locale?: Locale): string =>
  formatInEventTimezone(time, "d.M.yyyy", locale);

export const getShortDate = (time: Time, locale?: Locale): string =>
  formatInEventTimezone(time, "ccc d.M.", locale);

export const getTime = (time: Time, locale?: Locale): string =>
  formatInEventTimezone(time, "HH:mm", locale);

export const getShortWeekdayAndTime = (time: Time, locale?: Locale): string =>
  formatInEventTimezone(time, "ccc HH:mm", locale);

export const getTimezone = (time: Time, locale?: Locale): string =>
  formatInEventTimezone(time, "zzz", locale);

export const getDateAndTime = (time: Time, locale?: Locale): string =>
  formatInEventTimezone(time, "ccc d.M.yyyy HH:mm", locale);

// Deliberately the viewer's own timezone rather than the event's: these answer
// "what time is it where you are", next to the Finnish time in the same text.
// Only the timezone is local - the weekday still follows the UI language
export const getLocalDateAndTime = (time: Time, locale?: Locale): string =>
  format(time, "ccc d.M.yyyy HH:mm", { locale: resolveLocale(locale) });

export const getLocalTimezone = (time: Time, locale?: Locale): string =>
  format(time, "zzz", { locale: resolveLocale(locale) });

// For the generated statistics documents, which group rows by the event's wall
// clock. Numeric, so the active language never reaches the output
export const getIsoDate = (time: Time): string =>
  formatInEventTimezone(time, "yyyy-MM-dd");

// Those documents are written in English whatever the UI language is, so this
// names the locale instead of taking the active one
export const getShortWeekdayInEnglish = (time: Time): string =>
  format(time, "ccc", { in: tz(TIMEZONE), locale: localeFor(Locale.EN) });

export const formatProgramItemDuration = (mins: number): string => {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;

  const hoursStr = hours === 0 ? "" : `${hours} h`;
  const minutesStr = minutes === 0 ? "" : `${minutes} min`;

  return `${hoursStr} ${minutesStr}`;
};

export const formattedCurrentTime = (
  currentTime: Date,
  locale?: Locale,
): string => formatInEventTimezone(currentTime, "HH:mm:ss", locale);

// Describes `to` relative to `from`, e.g. "2 minutes ago" or "in an hour"
export const formatRelativeTime = (
  from: Date,
  to: Date,
  locale?: Locale,
): string =>
  formatDistance(to, from, {
    addSuffix: true,
    locale: resolveLocale(locale),
  });
