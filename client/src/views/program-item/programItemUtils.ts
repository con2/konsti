import { TZDate, tz } from "@date-fns/tz";
import { isSameMinute, isSameWeek } from "date-fns";
import { TFunction } from "i18next";
import { config } from "shared/config";
import { Locale } from "shared/types/locale";
import { ProgramItem, Tag } from "shared/types/models/programItem";
import { DirectSignup, LotterySignup } from "shared/types/models/user";
import { localeFor } from "shared/utils/setLocale";
import { getProgramItemStartTime } from "shared/utils/signupTimes";
import {
  getDateAndTime,
  getTime,
  getWeekdayAndTime,
} from "shared/utils/timeFormatter";
import { TIMEZONE } from "shared/utils/timezone";

export const isAlreadyLotterySigned = (
  programItemToCheck: ProgramItem,
  lotterySignups: readonly LotterySignup[],
): boolean => {
  return lotterySignups.some(
    (g) => g.programItemId === programItemToCheck.programItemId,
  );
};

export const isAlreadyDirectySigned = (
  programItemToCheck: ProgramItem,
  directSignups: readonly DirectSignup[],
): boolean => {
  return directSignups.some(
    (g) => g.programItemId === programItemToCheck.programItemId,
  );
};

// Find the user's existing direct sign-up that occupies the same time slot as a lottery item.
// Resolved through each sign-up's own program item rather than its stored signedToStartTime,
// which is never rewritten when a program item moves: the assignment settles attendees by where
// a program item starts now, so comparing the stored time would disagree with the server exactly
// in the rescheduling case. Compared as instants, since the two resolved times can be the same
// moment written differently - a configured parent time carries no milliseconds
export const getDirectSignupForSlot = <T extends { programItem: ProgramItem }>(
  directSignups: readonly T[],
  programItem: ProgramItem,
): T | undefined => {
  const programItemStartTime = getProgramItemStartTime(programItem);
  return directSignups.find((signup) =>
    isSameMinute(
      new Date(getProgramItemStartTime(signup.programItem)),
      new Date(programItemStartTime),
    ),
  );
};

// Whether we are in event week. Bucketed in the event timezone, like the times
// it decorates - a viewer an hour east would otherwise enter event week a day
// early and lose the date from every heading. The locale decides which day the
// week starts on, which for a Fri-Sun event decides whether it counts as one
// week.
//
// Cached because it is the expensive part of formatting a row (a timezone-aware
// isSameWeek costs ~65us, against ~1us without) while depending on nothing about
// the row: every visible program item recomputes the same answer. The inputs
// change at most once a clock tick
let eventWeekCache:
  | {
      timeNowMs: number;
      eventStartTime: string;
      locale: Locale;
      result: boolean;
    }
  | undefined;

const isEventWeek = (timeNow: Date, locale: Locale): boolean => {
  const { eventStartTime } = config.event();
  const timeNowMs = timeNow.getTime();

  if (
    eventWeekCache?.timeNowMs === timeNowMs &&
    eventWeekCache.eventStartTime === eventStartTime &&
    eventWeekCache.locale === locale
  ) {
    return eventWeekCache.result;
  }

  const result = isSameWeek(timeNow, new Date(eventStartTime), {
    in: tz(TIMEZONE),
    locale: localeFor(locale),
  });
  eventWeekCache = { timeNowMs, eventStartTime, locale, result };
  return result;
};

export const getFormattedTime = (
  time: Date,
  timeNow: Date,
  locale: Locale,
): string => {
  // Show weekday and time on event week
  if (isEventWeek(timeNow, locale)) {
    return getWeekdayAndTime(time.toISOString(), locale);
  }
  // Show full time before event week
  return getDateAndTime(time.toISOString(), locale);
};

export const isSameDayInEventTimezone = (
  time: Date,
  compared: Date,
): boolean => {
  const zoned = new TZDate(time, TIMEZONE);
  const zonedCompared = new TZDate(compared, TIMEZONE);
  return (
    zoned.getFullYear() === zonedCompared.getFullYear() &&
    zoned.getMonth() === zonedCompared.getMonth() &&
    zoned.getDate() === zonedCompared.getDate()
  );
};

/** Format a time interval in a human-friendly way for showing in the UI. */
export const getFormattedInterval = (
  startTime: Date,
  endTime: Date,
  timeNow: Date,
  locale: Locale,
): string => {
  const startFormatted = getFormattedTime(startTime, timeNow, locale);

  // Same day in the event timezone: an item running 23:00 -> 01:00 Helsinki
  // crosses midnight for everyone, whatever calendar day the viewer is on.
  // Compared as calendar fields rather than with a timezone-aware isSameDay,
  // which costs ~45us against ~10us here because each of its setters re-syncs
  const endFormatted = isSameDayInEventTimezone(startTime, endTime)
    ? getTime(endTime.toISOString(), locale)
    : getFormattedTime(endTime, timeNow, locale);

  // Note that the dash should be an en dash
  return `${startFormatted} – ${endFormatted}`;
};

interface EntryCondition {
  label: string;
  id: string;
}

export const getEntryCondition = (
  programItem: ProgramItem,
  t: TFunction,
): EntryCondition | null => {
  const { entryConditions } = config.event();

  const foundCondition = entryConditions.find((entryCondition) => {
    if (entryCondition.programItemIds.includes(programItem.programItemId)) {
      return entryCondition;
    }
  });

  if (foundCondition) {
    return {
      label: t(`signup.signupCondition.${foundCondition.conditionText}`),
      id: "signup-condition-agree-checkbox",
    };
  }

  if (programItem.tags.includes(Tag.K16)) {
    return {
      label: t("signup.signupCondition.k16"),
      id: "signup-condition-agree-checkbox",
    };
  }

  if (programItem.entryFee) {
    return {
      label: t("signup.signupCondition.entryFeeInfo", {
        ENTRY_FEE: programItem.entryFee,
      }),
      id: "entry-fee-agree-checkbox",
    };
  }
  return null;
};
