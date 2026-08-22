import { useMemo, useSyncExternalStore } from "react";
import { getLocaleSnapshot, subscribeToLocale } from "shared/utils/setLocale";
import {
  Time,
  formatProgramItemDuration,
  formatRelativeTime,
  formattedCurrentTime,
  getDate,
  getDateAndTime,
  getLocalDateAndTime,
  getLocalTimezone,
  getShortDate,
  getShortWeekdayAndTime,
  getTime,
  getTimezone,
  getWeekdayAndTime,
} from "shared/utils/timeFormatter";
import {
  getFormattedInterval,
  getFormattedTime,
} from "client/views/program-item/programItemUtils";

// The formatters, bound to the language the UI is currently in. Components take
// them from here rather than importing them directly, which a lint rule
// enforces: the active language lives in module state, which React cannot see,
// so a component formatting a time has nothing to re-render or recompute on when
// the language changes and keeps the string it first produced.
//
// Binding them here gives that dependency a place to live. The returned
// functions get a new identity on a switch, which invalidates every memoized
// expression that calls one, so call sites read exactly as they would if the
// language were not a concern at all
export const useTimeFormatters = (): TimeFormatters => {
  const locale = useSyncExternalStore(subscribeToLocale, getLocaleSnapshot);

  return useMemo(
    () => ({
      getWeekdayAndTime: (time: Time) => getWeekdayAndTime(time, locale),
      getDateAndTime: (time: Time) => getDateAndTime(time, locale),
      getTime: (time: Time) => getTime(time, locale),
      getShortWeekdayAndTime: (time: Time) =>
        getShortWeekdayAndTime(time, locale),
      getShortDate: (time: Time) => getShortDate(time, locale),
      getDate: (time: Time) => getDate(time, locale),
      getTimezone: (time: Time) => getTimezone(time, locale),
      getLocalDateAndTime: (time: Time) => getLocalDateAndTime(time, locale),
      getLocalTimezone: (time: Time) => getLocalTimezone(time, locale),
      formattedCurrentTime: (currentTime: Date) =>
        formattedCurrentTime(currentTime, locale),
      formatRelativeTime: (from: Date, to: Date) =>
        formatRelativeTime(from, to, locale),
      // Carries no language of its own, and is here so that nothing in the
      // client has a reason to reach for the formatter module directly
      formatProgramItemDuration,
      getFormattedTime: (time: Date, timeNow: Date) =>
        getFormattedTime(time, timeNow, locale),
      getFormattedInterval: (startTime: Date, endTime: Date, timeNow: Date) =>
        getFormattedInterval(startTime, endTime, timeNow, locale),
    }),
    [locale],
  );
};

interface TimeFormatters {
  getWeekdayAndTime: (time: Time) => string;
  getDateAndTime: (time: Time) => string;
  getTime: (time: Time) => string;
  getShortWeekdayAndTime: (time: Time) => string;
  getShortDate: (time: Time) => string;
  getDate: (time: Time) => string;
  getTimezone: (time: Time) => string;
  getLocalDateAndTime: (time: Time) => string;
  getLocalTimezone: (time: Time) => string;
  formattedCurrentTime: (currentTime: Date) => string;
  formatRelativeTime: (from: Date, to: Date) => string;
  formatProgramItemDuration: (mins: number) => string;
  getFormattedTime: (time: Date, timeNow: Date) => string;
  getFormattedInterval: (
    startTime: Date,
    endTime: Date,
    timeNow: Date,
  ) => string;
}
