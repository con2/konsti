import { Dayjs } from "dayjs";
import { ProgramItem } from "shared/types/models/programItem";
import { Signup } from "shared/types/models/user";
import { getDateAndTime, getWeekdayAndTime } from "client/utils/timeFormatter";
import { config } from "shared/config";

export const isAlreadyLotterySigned = (
  gameToCheck: ProgramItem,
  lotterySignups: readonly Signup[],
): boolean => {
  return lotterySignups.some(
    (g: Signup) => g.programItemDetails.gameId === gameToCheck.gameId,
  );
};

export const isAlreadyDirectySigned = (
  gameToCheck: ProgramItem,
  directSignups: readonly Signup[],
): boolean => {
  return directSignups.some(
    (g: Signup) => g.programItemDetails.gameId === gameToCheck.gameId,
  );
};

export const getSignupOpensDate = (
  signupStartTime: Dayjs,
  timeNow: Dayjs,
): string => {
  // Show weekday and time on convention week
  if (timeNow.isSame(config.shared().conventionStartTime, "week")) {
    return getWeekdayAndTime(signupStartTime.toISOString());
  }
  // Show full time before convention week
  return getDateAndTime(signupStartTime.toISOString());
};
