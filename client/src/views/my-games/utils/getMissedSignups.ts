import dayjs from "dayjs";
import { getStartTimes } from "client/utils/getStartTimes";
import { getSharedConfig } from "shared/config/sharedConfig";
import { getTimeNow } from "client/utils/getTimeNow";
import { SelectedGame } from "shared/typings/models/user";

export const getMissedSignups = (
  signedGames: readonly SelectedGame[],
  enteredGames: readonly SelectedGame[],
): string[] => {
  const timeNow = getTimeNow();

  const signedGamesStartTimes = getStartTimes(
    signedGames.map((signedGame) => signedGame.gameDetails),
  );

  // Get signup times for past signed games
  const pastSignupTimes = signedGamesStartTimes.filter(
    (signedGamesStartTime) => {
      const signupEndTime = dayjs(signedGamesStartTime).subtract(
        getSharedConfig().DIRECT_SIGNUP_START,
        "minutes",
      );

      if (signupEndTime.isBefore(dayjs(timeNow))) {
        return signedGamesStartTime;
      }
    },
  );

  // Check if there are past signed games without entered game => missed signup
  const missedSignupTimes = pastSignupTimes.filter((pastSignupTime) => {
    let found = false;
    if (enteredGames.length === 0) {
      return pastSignupTime;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    enteredGames.find((enteredGame) => {
      if (enteredGame.time === pastSignupTime) {
        found = true;
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!found) {
      return pastSignupTime;
    }
  });

  const missedSignups: string[] = missedSignupTimes.map((missedSignupTime) => {
    return missedSignupTime;
  });

  return missedSignups;
};
