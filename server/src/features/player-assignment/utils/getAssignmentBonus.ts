import { config } from "server/config";
import { Signup } from "server/features/signup/signup.typings";
import { User } from "shared/typings/models/user";

export const getAssignmentBonus = (
  playerGroup: User[],
  signups: readonly Signup[]
): number => {
  const groupMembersWithSignups = playerGroup.flatMap((groupMember) => {
    return signups.flatMap((signup) => {
      return signup.userSignups.filter(
        (userSignup) => userSignup.username === groupMember.username
      );
    });
  });

  const averageSignups = groupMembersWithSignups.length / playerGroup.length;

  const bonus = averageSignups < 0.5 ? config.firtSignupBonus : 0;
  return bonus;
};
