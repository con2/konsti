import { partition } from "lodash-es";
import { config } from "shared/config";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { User } from "shared/types/models/user";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramItem } from "shared/types/models/programItem";

export const getAssignmentBonus = (
  attendeeGroup: User[],
  directSignups: readonly DirectSignupsForProgramItem[],
  lotterySignupProgramItems: readonly ProgramItem[],
): number => {
  const { twoPhaseSignupProgramTypes, directSignupAlwaysOpenIds } =
    config.event();

  // Take program items with "twoPhaseSignupProgramTypes" which are not in "directSignupAlwaysOpenIds"
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
        (eventLogItem) => {
          const previousAssignment =
            eventLogItem.action === EventLogAction.NEW_ASSIGNMENT;
          const programItemExists = lotterySignupProgramItems.some(
            (programItem) =>
              programItem.programItemId === eventLogItem.programItemId,
          );
          return previousAssignment && programItemExists;
        },
      );

      if (previousDirectSignup ?? newAssignmentEvent) {
        return groupMember;
      }
    });

  // Give first time bonus to the whole group if half of the group members don't have previous direct signups
  const averagePreviousDirectSignups =
    groupMembersWithDirectSignups.length / attendeeGroup.length;
  const firstTimeBonus =
    averagePreviousDirectSignups <= 0.5 ? config.server().firstSignupBonus : 0;

  /** Additional first time bonus */

  // Get group members with previous NO_ASSIGNMENT event log items and without direct signups
  const groupMembersWithPreviousFailedLotterySignup =
    groupMembersWithoutDirectSignups.filter((groupMember) => {
      return groupMember.eventLogItems.find(
        (eventLogItem) => eventLogItem.action === EventLogAction.NO_ASSIGNMENT,
      );
    });

  // Give additional first time bonus to the whole group if half of the group members have previous failed lottery signups
  const averageFailedLotterySignups =
    groupMembersWithPreviousFailedLotterySignup.length / attendeeGroup.length;
  const additionalFirstTimeBonus =
    averageFailedLotterySignups >= 0.5
      ? config.server().additionalFirstSignupBonus
      : 0;

  return firstTimeBonus + additionalFirstTimeBonus;
};
