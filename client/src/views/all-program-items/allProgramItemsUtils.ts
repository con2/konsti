import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { ProgramItem } from "shared/types/models/programItem";

export const getTimeslotSignupStrategy = (
  gamesForStartTime: ProgramItem[],
): SignupStrategy => {
  // TODO:  How should we handle case where not all the games inside timeslot have same signup strategy?
  //        Should not be problem in real cases, but is it ok to fallback DIRECT if data is broken?
  return gamesForStartTime.every(
    (game) => game.signupStrategy === SignupStrategy.ALGORITHM,
  )
    ? SignupStrategy.ALGORITHM
    : SignupStrategy.DIRECT;
};
