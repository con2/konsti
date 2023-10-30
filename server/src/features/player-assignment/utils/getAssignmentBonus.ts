import { config } from "shared/config";
import { Signup } from "server/features/signup/signup.typings";
import { User } from "shared/typings/models/user";

export const getAssignmentBonus = (
  playerGroup: User[],
  signups: readonly Signup[],
): number => {
  const { twoPhaseSignupProgramTypes, directSignupAlwaysOpenIds } =
    config.shared();

  const signupsAffectingBonus = signups.filter(
    (signup) =>
      twoPhaseSignupProgramTypes.includes(signup.game.programType) &&
      !directSignupAlwaysOpenIds.includes(signup.game.gameId),
  );

  const groupMembersWithSignups = playerGroup.flatMap((groupMember) => {
    return signupsAffectingBonus.flatMap((signup) => {
      return signup.userSignups.filter(
        (userSignup) => userSignup.username === groupMember.username,
      );
    });
  });

  const averageSignups = groupMembersWithSignups.length / playerGroup.length;

  const bonus = averageSignups < 0.5 ? config.server().firtSignupBonus : 0;
  return bonus;
};
