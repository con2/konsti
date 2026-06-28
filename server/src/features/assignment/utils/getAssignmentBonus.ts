import dayjs from "dayjs";
import { partition } from "remeda";
import { config } from "shared/config";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { User } from "shared/types/models/user";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramItem } from "shared/types/models/programItem";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";

export const getAssignmentBonus = (
  attendeeGroup: User[],
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
  lotterySignupProgramItems: readonly ProgramItem[],
  assignmentTime: string,
): number => {
  /** First time bonus */

  // A re-run must not count its own results as "previous" (which would strip the bonus and
  // change outcomes): ignore lottery wins (priority > 0) and NEW_ASSIGNMENT events at the
  // current assignmentTime, but keep genuine first-come-first-served direct signups
  const isCurrentAssignment = (startTime: string): boolean =>
    dayjs(startTime).isSame(dayjs(assignmentTime), "minute");

  // Get group members with previous direct signups or NEW_ASSIGNMENT event log items
  const [groupMembersWithDirectSignups, groupMembersWithoutDirectSignups] =
    partition(attendeeGroup, (groupMember) => {
      const previousDirectSignup = lotteryParticipantDirectSignups.find(
        (programItem) => {
          return programItem.userSignups.find(
            (userSignup) =>
              userSignup.username === groupMember.username &&
              // Exclude this lottery's own win (priority > 0) at the current time, but keep
              // first-come-first-served (priority 0) signups counting as "previous"
              !(
                isCurrentAssignment(userSignup.signedToStartTime) &&
                userSignup.priority !== DIRECT_SIGNUP_PRIORITY
              ),
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
          return (
            previousAssignment &&
            programItemExists &&
            !isCurrentAssignment(eventLogItem.programItemStartTime)
          );
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
