import moment from 'moment';
import { getStartTimes } from 'utils/getStartTimes';
import { config } from 'config';
import { Signup } from 'typings/user.typings';
import { getTime } from 'utils/getTime';

export const getMissedSignups = (
  signedGames: readonly Signup[],
  enteredGames: readonly Signup[]
): string[] => {
  const timeNow = getTime();

  const signedGamesStartTimes = getStartTimes(
    signedGames.map((signedGame) => signedGame.gameDetails)
  );

  // Get signup times for past signed games
  const pastSignupTimes = signedGamesStartTimes.filter(
    (signedGamesStartTime) => {
      const signupEndTime = moment(signedGamesStartTime).subtract(
        config.SIGNUP_END_TIME,
        'minutes'
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
