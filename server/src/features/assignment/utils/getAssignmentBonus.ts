import { isSameMinute } from "date-fns";
import { partition } from "remeda";
import { config } from "shared/config";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

export const getAssignmentBonus = (
  attendeeGroup: User[],
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
  lotterySignupProgramItems: readonly ProgramItem[],
  assignmentTime: string,
): number => {
  /** First time bonus */

  // A run must not count results for its own start time as "previous", which would strip the
  // bonus and change outcomes: ignore lottery wins (priority > 0) and NEW_ASSIGNMENT events at
  // the current assignmentTime, but keep genuine first-come-first-served direct sign-ups
  const isCurrentAssignment = (startTime: string): boolean =>
    isSameMinute(new Date(startTime), new Date(assignmentTime));

  // Get group members with previous direct sign-ups or NEW_ASSIGNMENT event log items
  const [groupMembersWithDirectSignups, groupMembersWithoutDirectSignups] =
    partition(attendeeGroup, (groupMember) => {
      const previousDirectSignup = lotteryParticipantDirectSignups.find(
        (programItem) => {
          return programItem.userSignups.find(
            (userSignup) =>
              userSignup.username === groupMember.username &&
              // Exclude this lottery's own win (priority > 0) at the current time, but keep
              // first-come-first-served (priority 0) sign-ups counting as "previous"
              !(
                isCurrentAssignment(userSignup.signedToStartTime) &&
                userSignup.priority !== DIRECT_SIGNUP_PRIORITY
              ),
          );
        },
      );
      // A placement the attendee never got to attend is not one they spent: cancelling their
      // own sign-up costs the bonus, the program item being cancelled does not
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

  // Give first time bonus to the whole group if half of the group members don't have previous direct sign-ups
  const averagePreviousDirectSignups =
    groupMembersWithDirectSignups.length / attendeeGroup.length;
  const firstTimeBonus =
    averagePreviousDirectSignups <= 0.5 ? config.server().firstSignupBonus : 0;

  /** Additional first time bonus */

  // Get group members with previous NO_ASSIGNMENT event log items and without direct sign-ups.
  // Ignore a NO_ASSIGNMENT from the current assignmentTime. A run that rejected everyone and
  // then failed before marking its items can be run again, and counting the items it wrote
  // would make the retry boost the very attendees the first attempt turned down
  const groupMembersWithPreviousFailedLotterySignup =
    groupMembersWithoutDirectSignups.filter((groupMember) => {
      return groupMember.eventLogItems.find(
        (eventLogItem) =>
          eventLogItem.action === EventLogAction.NO_ASSIGNMENT &&
          !isCurrentAssignment(eventLogItem.programItemStartTime),
      );
    });

  // Give additional first time bonus to the whole group if half of the group members have previous failed lottery sign-ups
  const averageFailedLotterySignups =
    groupMembersWithPreviousFailedLotterySignup.length / attendeeGroup.length;
  const additionalFirstTimeBonus =
    averageFailedLotterySignups >= 0.5
      ? config.server().additionalFirstSignupBonus
      : 0;

  return firstTimeBonus + additionalFirstTimeBonus;
};
