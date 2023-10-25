import { serverConfig } from "server/serverConfig";
import { Signup } from "server/features/signup/signup.typings";
import { sharedConfig } from "shared/config/sharedConfig";
import { ProgramType } from "shared/typings/models/game";
import { User } from "shared/typings/models/user";

export const getAssignmentBonus = (
  playerGroup: User[],
  signups: readonly Signup[],
): number => {
  const signupsAffectingBonus = signups.filter(
    (signup) =>
      signup.game.programType === ProgramType.TABLETOP_RPG &&
      !sharedConfig.directSignupAlwaysOpenIds.includes(signup.game.gameId),
  );

  const groupMembersWithSignups = playerGroup.flatMap((groupMember) => {
    return signupsAffectingBonus.flatMap((signup) => {
      return signup.userSignups.filter(
        (userSignup) => userSignup.username === groupMember.username,
      );
    });
  });

  const averageSignups = groupMembersWithSignups.length / playerGroup.length;

  const bonus = averageSignups < 0.5 ? serverConfig.firtSignupBonus : 0;
  return bonus;
};
