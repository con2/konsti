import { ProgramItemDirectSignups } from "client/types/reduxTypes";
import { UserSignup } from "shared/types/models/programItem";

export const getUsersForProgramItemId = (
  programItemId: string,
  directSignups: readonly ProgramItemDirectSignups[],
): UserSignup[] => {
  const foundSignup = directSignups.find(
    (signup) => signup.programItemId === programItemId,
  );
  return foundSignup?.users ?? [];
};
