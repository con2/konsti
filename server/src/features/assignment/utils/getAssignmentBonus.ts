import { partition } from "remeda";
import { config } from "shared/config";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { User } from "shared/types/models/user";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramItem } from "shared/types/models/programItem";

export const getAssignmentBonus = (
  attendeeGroup: User[],
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
  lotterySignupProgramItems: readonly ProgramItem[],
): number => {
  /** First time bonus */

  // Get group members with direct signups or NEW_ASSIGNMENT event log items
  // TODO: Should filter out directSignups and eventLogItems with current assignmentTime so possible re-assignment is not affected
  const [groupMembersWithDirectSignups, groupMembersWithoutDirectSignups] =
    partition(attendeeGroup, (groupMember) => {
      const previousDirectSignup = lotteryParticipantDirectSignups.find(
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
        return true;
      }
      return false;
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
