import dayjs from "dayjs";
import { config } from "shared/config";
import { ProgramItem, SignupType } from "shared/types/models/programItem";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { getProgramItemStartTime } from "shared/utils/signupTimes";

interface ProgramItemValidity {
  isValidMinAttendanceValue: boolean;
  isValidMaxAttendanceValue: boolean;
  minAttendanceBiggerThanMax: boolean;
  signupTypeMissing: boolean;
  lotteryItemNotStartingOnEvenHour: boolean;
  allValuesValid: boolean;
}

// Check if a program item is missing required info, like attendance limits.
// Invalid program items cannot be signed up to
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
