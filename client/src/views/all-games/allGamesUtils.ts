import dayjs from "dayjs";
import { sharedConfig } from "shared/config/sharedConfig";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Game, ProgramType } from "shared/typings/models/game";

const { CONVENTION_START_TIME } = sharedConfig;

export const getTimeslotSignupStrategy = (
  gamesForStartTime: Game[],
  activeProgramType: ProgramType,
  startTime: string
): SignupStrategy => {
  if (activeProgramType === ProgramType.TABLETOP_RPG) {
    // Return DIRECT for three first hours of convention because there is no time for algorithm signup
    // For example, if convention starts at 15:00 and PRE_SIGNUP_START is 4h and DIRECT_SIGNUP_START is 2h
    //   Start time 15:00 -> algorithm 11:00-13:00 -> use direct
    //   Start time 16:00 -> algorithm 12:00-14:00 -> use direct
    //   Start time 17:00 -> algorithm 13:00-15:00 -> use direct
    //   Start time 18:00 -> algorithm 14:00-16:00 -> algorithm with shorter duration 15:00-16:00 (see signupTimes.ts)
    //   Start time 19:00 -> algorithm 15:00-17:00 -> show normally

    const noAlgorithmSignupBefore = dayjs(CONVENTION_START_TIME).add(
      3,
      "hours"
    );

    if (dayjs(startTime).isBefore(noAlgorithmSignupBefore)) {
      return SignupStrategy.DIRECT;
    }

    // TODO:  How should we handle case where not all the games inside timeslot have same signup strategy?
    //        Should not be problem in real cases, but is it ok to fallback ALGORITHM if data is broken?
    return gamesForStartTime.every(
      (game) => game.signupStrategy === SignupStrategy.DIRECT
    )
      ? SignupStrategy.DIRECT
      : SignupStrategy.ALGORITHM;
  }

  return SignupStrategy.DIRECT;
};
