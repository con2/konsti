import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { ProgramItem } from "shared/types/models/programItem";

export const getTimeslotSignupStrategy = (
  programItemsForStartTime: ProgramItem[],
): SignupStrategy => {
  // TODO:  How should we handle case where not all the program items inside timeslot have same signup strategy?
  //        Should not be problem in real cases, but is it ok to fallback DIRECT if data is broken?
  return programItemsForStartTime.every(
    (programItem) => programItem.signupStrategy === SignupStrategy.ALGORITHM,
  )
    ? SignupStrategy.ALGORITHM
    : SignupStrategy.DIRECT;
};
