import { config } from "shared/config";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { User } from "shared/types/models/user";

export const getAssignmentBonus = (
  attendeeGroup: User[],
  directSignups: readonly DirectSignupsForProgramItem[],
): number => {
  const { twoPhaseSignupProgramTypes, directSignupAlwaysOpenIds } =
    config.shared();

  const signupsAffectingBonus = directSignups.filter(
    (directSignup) =>
      twoPhaseSignupProgramTypes.includes(
        directSignup.programItem.programType,
      ) &&
      !directSignupAlwaysOpenIds.includes(
        directSignup.programItem.programItemId,
      ),
  );

  const groupMembersWithSignups = attendeeGroup.flatMap((groupMember) => {
    return signupsAffectingBonus.flatMap((signup) => {
      return signup.userSignups.filter(
        (userSignup) => userSignup.username === groupMember.username,
      );
    });
  });

  const averageSignups = groupMembersWithSignups.length / attendeeGroup.length;
  const bonus = averageSignups < 0.5 ? config.server().firstSignupBonus : 0;
  return bonus;
};
