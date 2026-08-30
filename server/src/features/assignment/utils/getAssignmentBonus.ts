import { partition, unique } from "remeda";
import { config } from "shared/config";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramItem, State } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { isSameTime } from "shared/utils/timeComparison";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

export interface AssignmentBonusContext {
  thisRunsProgramItemIds: ReadonlySet<string>;
  currentStartTimes: readonly string[];
  stillRunningProgramItemIds: ReadonlySet<string>;
}

// Built once per algorithm pass: every attendee group asks the same questions of the same
// programme
export const getAssignmentBonusContext = (
  allProgramItems: readonly ProgramItem[],
  assignmentTime: string,
): AssignmentBonusContext => {
  // The lottery program items this starting time decides. Not only the ones still being
  // lotteried: a retry drops the items an earlier attempt placed people into, and that
  // attempt's results must still read as this run's rather than as a lottery they lost.
  const startingProgramItems = getStartingProgramItems(
    allProgramItems,
    assignmentTime,
  ).filter(
    (programItem) =>
      isLotterySignupProgramItem(programItem) &&
      programItem.state === State.ACCEPTED,
  );

  return {
    thisRunsProgramItemIds: new Set(
      startingProgramItems.map((programItem) => programItem.programItemId),
    ),
    // A rejection names no program item, so it is matched by the time it carries: the run's own
    // hour, or any hour its program items start
    currentStartTimes: unique([
      assignmentTime,
      ...startingProgramItems.map((programItem) => programItem.startTime),
    ]),
    // A placement the attendee never got to attend is not one they spent: cancelling their own
    // sign-up costs the bonus, the program item being cancelled does not. Asked of the whole
    // programme, since a placement at any other start time is still a placement.
    stillRunningProgramItemIds: new Set(
      allProgramItems
        .filter((programItem) => programItem.state === State.ACCEPTED)
        .map((programItem) => programItem.programItemId),
    ),
  };
};

export const getAssignmentBonus = (
  attendeeGroup: User[],
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
  {
    thisRunsProgramItemIds,
    currentStartTimes,
    stillRunningProgramItemIds,
  }: AssignmentBonusContext,
): number => {
  /** First time bonus */

  const isCurrentStartTime = (startTime: string): boolean =>
    currentStartTimes.some((currentStartTime) =>
      isSameTime(startTime, currentStartTime),
    );

  // This run wrote it: for one of the program items it decides, and at one of the hours it
  // covers. Neither half alone will do - an item can carry a placement from before it was
  // rescheduled onto this hour, and another lottery can cover this hour with its own items.
  const isThisRunsOwn = (programItemId: string, startTime: string): boolean =>
    thisRunsProgramItemIds.has(programItemId) && isCurrentStartTime(startTime);

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
                isThisRunsOwn(
                  directSignup.programItemId,
                  userSignup.signedToStartTime,
                ) && userSignup.priority !== DIRECT_SIGNUP_PRIORITY
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
            !isThisRunsOwn(
              eventLogItem.programItemId,
              eventLogItem.programItemStartTime,
            )
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
  // would make the retry boost the very attendees the first attempt turned down.
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
