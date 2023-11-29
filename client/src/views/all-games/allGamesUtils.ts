import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { Game } from "shared/types/models/game";

export const getTimeslotSignupStrategy = (
  gamesForStartTime: Game[],
): SignupStrategy => {
  // TODO:  How should we handle case where not all the games inside timeslot have same signup strategy?
  //        Should not be problem in real cases, but is it ok to fallback DIRECT if data is broken?
  return gamesForStartTime.every(
    (game) => game.signupStrategy === SignupStrategy.ALGORITHM,
  )
    ? SignupStrategy.ALGORITHM
    : SignupStrategy.DIRECT;
};
