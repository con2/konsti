import moment from "moment";
import { getStartTimes } from "client/utils/getStartTimes";
import { sharedConfig } from "shared/config/sharedConfig";
import { getTime } from "client/utils/getTime";
import { SelectedGame } from "shared/typings/models/user";

export const getMissedSignups = (
  signedGames: readonly SelectedGame[],
  enteredGames: readonly SelectedGame[]
): string[] => {
  const timeNow = getTime();

  const signedGamesStartTimes = getStartTimes(
    signedGames.map((signedGame) => signedGame.gameDetails)
  );

  // Get signup times for past signed games
  const pastSignupTimes = signedGamesStartTimes.filter(
    (signedGamesStartTime) => {
      const signupEndTime = moment(signedGamesStartTime).subtract(
        sharedConfig.SIGNUP_END_TIME,
        "minutes"
      );

      if (signupEndTime.isBefore(moment(timeNow))) {
        return signedGamesStartTime;
      }
    }
  );

  // Check if there are past signed games without entered game => missed signup
  const missedSignupTimes = pastSignupTimes.filter((pastSignupTime) => {
    let found = false;
    if (enteredGames.length === 0) {
      return pastSignupTime;
    }

    enteredGames.find((enteredGame) => {
      if (enteredGame.time === pastSignupTime) {
        found = true;
      }
    });

    if (!found) {
      return pastSignupTime;
    }
  });

  const missedSignups: string[] = missedSignupTimes.map((missedSignupTime) => {
    return missedSignupTime;
  });

  return missedSignups;
};
