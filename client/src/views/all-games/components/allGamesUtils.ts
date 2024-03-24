import { Dayjs } from "dayjs";
import { Game } from "shared/types/models/game";
import { SelectedGame } from "shared/types/models/user";
import { getDateAndTime, getWeekdayAndTime } from "client/utils/timeFormatter";
import { config } from "shared/config";

export const isAlreadySigned = (
  gameToCheck: Game,
  signedGames: readonly SelectedGame[],
): boolean => {
  return signedGames.some(
    (g: SelectedGame) => g.gameDetails.gameId === gameToCheck.gameId,
  );
};

export const isAlreadyEntered = (
  gameToCheck: Game,
  enteredGames: readonly SelectedGame[],
): boolean => {
  return enteredGames.some(
    (g: SelectedGame) => g.gameDetails.gameId === gameToCheck.gameId,
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
