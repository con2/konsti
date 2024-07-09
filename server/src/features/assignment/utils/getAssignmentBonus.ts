import { partition } from "lodash-es";
import { config } from "shared/config";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { User } from "shared/types/models/user";
import { EventLogAction } from "shared/types/models/eventLog";

export const getAssignmentBonus = (
  attendeeGroup: User[],
  directSignups: readonly DirectSignupsForProgramItem[],
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

  // Get group members with direct signups or NEW_ASSIGNMENT event log items
  const [groupMembersWithDirectSignups, groupMembersWithoutDirectSignups] =
    partition(attendeeGroup, (groupMember) => {
      const previousDirectSignup = bonusAffectingDirectSignupsProgramItems.find(
        (programItem) => {
          return programItem.userSignups.find(
            (userSignup) => userSignup.username === groupMember.username,
          );
        },
      );
      const newAssignmentEvent = groupMember.eventLogItems.find(
        (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
      );
      if (previousDirectSignup ?? newAssignmentEvent) {
        return groupMember;
      }
    });

  // Give first time bonus to the whole group if half of the group members don't have previous direct signup
  const averagePreviousDirectSignups =
    groupMembersWithDirectSignups.length / attendeeGroup.length;
  const firstTimeBonus =
    averagePreviousDirectSignups <= 0.5 ? config.server().firstSignupBonus : 0;

  /** Cumulative first time bonus */

  // Get group members with previous NO_ASSIGNMENT event log items
  const groupMembersWithPreviousFailedLotterySignup =
    groupMembersWithoutDirectSignups.filter((groupMember) => {
      return groupMember.eventLogItems.find(
        (eventLogItem) => eventLogItem.action === EventLogAction.NO_ASSIGNMENT,
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
