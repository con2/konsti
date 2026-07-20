import dayjs, { Dayjs } from "dayjs";
import { TFunction } from "i18next";
import { ProgramItem, SignupType, Tag } from "shared/types/models/programItem";
import { DirectSignup, LotterySignup } from "shared/types/models/user";
import {
  getDateAndTime,
  getTime,
  getWeekdayAndTime,
} from "shared/utils/timeFormatter";
import { config } from "shared/config";
import { getProgramItemStartTime } from "shared/utils/signupTimes";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";

interface ProgramItemValidity {
  isValidMinAttendanceValue: boolean;
  isValidMaxAttendanceValue: boolean;
  minAttendanceBiggerThanMax: boolean;
  signupTypeMissing: boolean;
  lotteryItemNotStartingOnEvenHour: boolean;
  allValuesValid: boolean;
}

// Check if a program item is missing required info, like attendance limits
export const getProgramItemValidity = (
  programItem: ProgramItem,
): ProgramItemValidity => {
  const { noKonstiSignupIds } = config.event();

  const usesKonstiSignup =
    programItem.signupType === SignupType.KONSTI &&
    !noKonstiSignupIds.includes(programItem.programItemId);

  const isValidMinAttendanceValue = programItem.minAttendance > 0;

  const isValidMaxAttendanceValue =
    !usesKonstiSignup || programItem.maxAttendance > 0;

  const minAttendanceBiggerThanMax =
    programItem.minAttendance > programItem.maxAttendance &&
    programItem.maxAttendance > 0;

  const signupTypeMissing = programItem.signupType === SignupType.MISSING;

  // Lottery batches signups by start time, so lottery items must start at an
  // even hour. Checked against the parent-resolved start time: a parent
  // override to an even hour makes the item valid
  const lotteryItemNotStartingOnEvenHour =
    usesKonstiSignup &&
    isLotterySignupProgramItem(programItem) &&
    dayjs(getProgramItemStartTime(programItem)).minute() !== 0;

  const allValuesValid =
    isValidMinAttendanceValue &&
    isValidMaxAttendanceValue &&
    !minAttendanceBiggerThanMax &&
    !signupTypeMissing &&
    !lotteryItemNotStartingOnEvenHour;

  return {
    isValidMinAttendanceValue,
    isValidMaxAttendanceValue,
    minAttendanceBiggerThanMax,
    signupTypeMissing,
    lotteryItemNotStartingOnEvenHour,
    allValuesValid,
  };
};

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

// Find the user's existing direct signup that occupies the same time slot as a lottery item.
// Direct signups store the parent-resolved start time, so match against that, not the item's own
export const getDirectSignupForSlot = <T extends { signedToStartTime: string }>(
  directSignups: readonly T[],
  programItem: ProgramItem,
): T | undefined => {
  const programItemStartTime = getProgramItemStartTime(programItem);
  return directSignups.find(
    (signup) => signup.signedToStartTime === programItemStartTime,
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
