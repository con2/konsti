import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Game, ProgramType } from "shared/typings/models/game";

export const getTimeslotSignupStrategy = (
  gamesForStartTime: Game[],
  activeProgramType: ProgramType
): SignupStrategy => {
  if (activeProgramType === ProgramType.TABLETOP_RPG) {
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
