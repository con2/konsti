import { partition } from "lodash-es";
import { config } from "shared/config";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { User } from "shared/types/models/user";

export const getAssignmentBonus = (
  attendeeGroup: User[],
  directSignups: readonly DirectSignupsForProgramItem[],
  startTime: string,
): number => {
  const { twoPhaseSignupProgramTypes, directSignupAlwaysOpenIds } =
    config.shared();

  // Take program items with two phase signup which are not "signup always open"
  const bonusAffectingDirectSignupsProgramItems = directSignups.filter(
    (directSignup) =>
      twoPhaseSignupProgramTypes.includes(
        directSignup.programItem.programType,
      ) &&
      !directSignupAlwaysOpenIds.includes(
        directSignup.programItem.programItemId,
      ),
  );

  /** First time bonus */

  // Get group members with and without direct signups
  const [groupMembersWithDirectSignups, groupMembersWithoutDirectSignups] =
    partition(attendeeGroup, (groupMember) => {
      const previousDirectSignup = bonusAffectingDirectSignupsProgramItems.find(
        (programItem) => {
          return programItem.userSignups.find(
            (userSignup) => userSignup.username === groupMember.username,
          );
        },
      );
      if (previousDirectSignup) {
        return groupMember;
      }
    });

  // Give first time bonus to the whole group if half of the group members don't have previous direct signup
  const averagePreviousDirectSignups =
    groupMembersWithDirectSignups.length / attendeeGroup.length;
  const firstTimeBonus =
    averagePreviousDirectSignups <= 0.5 ? config.server().firstSignupBonus : 0;

  /** Cumulative first time bonus */

  // Get group members without direct signups and with previous lottery signup
  const groupMembersWithPreviousFailedLotterySignup =
    groupMembersWithoutDirectSignups.flatMap((groupMember) => {
      return groupMember.lotterySignups.filter(
        (lotterySignup) => lotterySignup.time !== startTime,
      );
    });

  // Give additional cumulative first time bonus to the whole group if half of the group members have previous failed lottery signup
  const averageFailedLotterySignups =
    groupMembersWithPreviousFailedLotterySignup.length / attendeeGroup.length;
  const cumulativeFirstTimeBonus =
    averageFailedLotterySignups >= 0.5
      ? config.server().cumulativeFirstSignupBonus
      : 0;

  return firstTimeBonus + cumulativeFirstTimeBonus;
};
