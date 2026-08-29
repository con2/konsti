import { partition, unique } from "remeda";
import { config } from "shared/config";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramItem, State } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import { isSameTime } from "shared/utils/timeComparison";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

export interface AssignmentBonusContext {
  currentStartTimes: readonly string[];
  stillRunningProgramItemIds: ReadonlySet<string>;
}

// Built once per algorithm pass: every attendee group asks the same questions of the same
// programme
export const getAssignmentBonusContext = (
  lotterySignupProgramItems: readonly ProgramItem[],
  allProgramItems: readonly ProgramItem[],
  assignmentTime: string,
): AssignmentBonusContext => ({
  // A run must not count results for its own start time as "previous", which would strip the
  // bonus and change outcomes. Both are recorded against the hour the attendee turns up, so a
  // batched run - whose own time is the parent's - is recognised by the hours it covers
  currentStartTimes: unique([
    assignmentTime,
    ...lotterySignupProgramItems.map((programItem) => programItem.startTime),
  ]),
  // A placement the attendee never got to attend is not one they spent: cancelling their own
  // sign-up costs the bonus, the program item being cancelled does not. Asked of the whole
  // programme, since a placement at any other start time is still a placement
  stillRunningProgramItemIds: new Set(
    allProgramItems
      .filter((programItem) => programItem.state === State.ACCEPTED)
      .map((programItem) => programItem.programItemId),
  ),
});

export const getAssignmentBonus = (
  attendeeGroup: User[],
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
  { currentStartTimes, stillRunningProgramItemIds }: AssignmentBonusContext,
): number => {
  /** First time bonus */

  const isCurrentStartTime = (startTime: string): boolean =>
    currentStartTimes.some((currentStartTime) =>
      isSameTime(startTime, currentStartTime),
    );

  // Get group members with previous direct sign-ups or NEW_ASSIGNMENT event log items
  const [groupMembersWithDirectSignups, groupMembersWithoutDirectSignups] =
    partition(attendeeGroup, (groupMember) => {
      const previousDirectSignup = lotteryParticipantDirectSignups.find(
        (directSignup) => {
          return directSignup.userSignups.find(
            (userSignup) =>
              userSignup.username === groupMember.username &&
              // Exclude this run's own win (priority > 0), but keep first-come-first-served
              // (priority 0) sign-ups counting as "previous"
              !(
                isCurrentStartTime(userSignup.signedToStartTime) &&
                userSignup.priority !== DIRECT_SIGNUP_PRIORITY
              ),
          );
        },
      );
      const newAssignmentEvent = groupMember.eventLogItems.find(
        (eventLogItem) => {
          const previousAssignment =
            eventLogItem.action === EventLogAction.NEW_ASSIGNMENT;
          const programItemExists = stillRunningProgramItemIds.has(
            eventLogItem.programItemId,
          );
          return (
            previousAssignment &&
            programItemExists &&
            !isCurrentStartTime(eventLogItem.programItemStartTime)
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
          !isCurrentStartTime(eventLogItem.programItemStartTime),
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
