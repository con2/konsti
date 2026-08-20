import { isSameDay, isSameWeek } from "date-fns";
import { TFunction } from "i18next";
import { config } from "shared/config";
import { ProgramItem, Tag } from "shared/types/models/programItem";
import { DirectSignup, LotterySignup } from "shared/types/models/user";
import { getCurrentLocale } from "shared/utils/setLocale";
import { getProgramItemStartTime } from "shared/utils/signupTimes";
import {
  getDateAndTime,
  getTime,
  getWeekdayAndTime,
} from "shared/utils/timeFormatter";

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
// Direct sign-ups store the parent-resolved start time, so match against that, not the item's own
export const getDirectSignupForSlot = <T extends { signedToStartTime: string }>(
  directSignups: readonly T[],
  programItem: ProgramItem,
): T | undefined => {
  const programItemStartTime = getProgramItemStartTime(programItem);
  return directSignups.find(
    (signup) => signup.signedToStartTime === programItemStartTime,
  );
};

export const getFormattedTime = (time: Date, timeNow: Date): string => {
  // Show weekday and time on event week. The locale decides which day the week
  // starts on, which for a Fri-Sun event decides whether it counts as one week
  if (
    isSameWeek(timeNow, new Date(config.event().eventStartTime), {
      locale: getCurrentLocale(),
    })
  ) {
    return getWeekdayAndTime(time.toISOString());
  }
  // Show full time before event week
  return getDateAndTime(time.toISOString());
};

/** Format a time interval in a human-friendly way for showing in the UI. */
export const getFormattedInterval = (
  startTime: Date,
  endTime: Date,
  timeNow: Date,
): string => {
  const startFormatted = getFormattedTime(startTime, timeNow);

  const endFormatted = isSameDay(startTime, endTime)
    ? getTime(endTime.toISOString())
    : getFormattedTime(endTime, timeNow);

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
