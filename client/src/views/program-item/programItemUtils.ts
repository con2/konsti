import { Dayjs } from "dayjs";
import { TFunction } from "i18next";
import { ProgramItem } from "shared/types/models/programItem";
import { Signup } from "shared/types/models/user";
import {
  getDateAndTime,
  getTime,
  getWeekdayAndTime,
} from "client/utils/timeFormatter";
import { config } from "shared/config";

export const isAlreadyLotterySigned = (
  programItemToCheck: ProgramItem,
  lotterySignups: readonly Signup[],
): boolean => {
  return lotterySignups.some(
    (g: Signup) =>
      g.programItem.programItemId === programItemToCheck.programItemId,
  );
};

export const isAlreadyDirectySigned = (
  programItemToCheck: ProgramItem,
  directSignups: readonly Signup[],
): boolean => {
  return directSignups.some(
    (g: Signup) =>
      g.programItem.programItemId === programItemToCheck.programItemId,
  );
};

export const getFormattedTime = (time: Dayjs, timeNow: Dayjs): string => {
  // Show weekday and time on event week
  if (timeNow.isSame(config.event().eventStartTime, "week")) {
    return getWeekdayAndTime(time.toISOString());
  }
  // Show full time before event week
  return getDateAndTime(time.toISOString());
};

/** Format a time interval in a human-friendly way for showing in the UI. */
export const getFormattedInterval = (
  startTime: Dayjs,
  endTime: Dayjs,
  timeNow: Dayjs,
): string => {
  const startFormatted = getFormattedTime(startTime, timeNow);

  const endFormatted = startTime.isSame(endTime, "day")
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
