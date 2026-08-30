import { firstBy, unique } from "remeda";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import { EventLogAction } from "shared/types/models/eventLog";
import {
  ProgramItem,
  ProgramType,
  State,
} from "shared/types/models/programItem";
import { UserAssignmentResult } from "shared/types/models/result";
import { Settings } from "shared/types/models/settings";
import { User } from "shared/types/models/user";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { hasLotteryAlreadyRun } from "shared/utils/signupTimes";
import { isSameTime } from "shared/utils/timeComparison";
import { getGroupCreators } from "server/features/assignment/utils/getGroupCreators";
import { getGroupMembersWithCreatorLotterySignups } from "server/features/assignment/utils/getGroupMembers";
import { getLotterySignups } from "server/features/assignment/utils/getLotterySignups";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { findDirectSignupsByProgramItemIds } from "server/features/direct-signup/directSignupRepository";
import { findOrCreateSettings } from "server/features/settings/settingsRepository";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import { logger } from "server/utils/logger";
import {
  NotificationQueueService,
  NotificationTask,
  NotificationTaskType,
  getGlobalNotificationQueueService,
} from "server/utils/notificationQueue";

interface AddAssignmentNotificationsParams {
  assignmentTime: string;
  finalResults: readonly UserAssignmentResult[];
  users: User[];
  programItems: ProgramItem[];
}

// The spots are already saved and the start time already closed when this runs, so failures
// are only logged and never returned: an error escaping to the caller would fail the run and
// skip the overlap lottery sign-up cleanup
export const addAssignmentNotifications = async ({
  assignmentTime,
  finalResults,
  users,
  programItems,
}: AddAssignmentNotificationsParams): Promise<void> => {
  const queueService = getGlobalNotificationQueueService();

  const settingsResult = await findOrCreateSettings();
  let settings: Settings | null = null;
  if (settingsResult.ok) {
    settings = settingsResult.value;
  } else {
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: failed to find settings, skip queueing emails`,
      ),
    );
  }

  // Get users who didn't get a spot in lottery. The lottery program items at this starting
  // time, whatever the run went on to do with each of them: this one set decides both who is
  // rejected and what the rejection names, so a rejected attendee's slot is always inside it.
  const startingProgramItems = getStartingProgramItems(
    programItems,
    assignmentTime,
  ).filter(
    (programItem) =>
      isLotterySignupProgramItem(programItem) &&
      // A cancelled one was never in the run - the same rule the algorithm's own input follows -
      // so it neither rejects anybody nor stretches the span the rejection names
      programItem.state === State.ACCEPTED &&
      // Lotteried at a slot it no longer starts at, so this run neither considered nor
      // rejected anybody over it: the spot it brought with it says nothing about this hour,
      // and the span it covers is not part of what was lotteried here
      !hasLotteryAlreadyRun(programItem),
  );
  const groupCreators = getGroupCreators(users, startingProgramItems);
  const groupMembers = getGroupMembersWithCreatorLotterySignups(
    groupCreators,
    users,
  );
  // Everyone with a live lottery sign-up for this start time took part, so everyone hears the
  // outcome - including an attendee who already holds a spot at that hour. The lottery really
  // did consider them and really did not place them.
  const lotterySignups = getLotterySignups([...groupCreators, ...groupMembers]);

  // A sign-up naming a program item that does not start at this time was not part of this run,
  // so its holder is neither placed nor rejected by it
  const startingProgramItemIds = new Set(
    startingProgramItems.map((programItem) => programItem.programItemId),
  );
  const lotterySignupsForStartingTime = lotterySignups.filter((lotterySignup) =>
    startingProgramItemIds.has(lotterySignup.programItemId),
  );

  const lotterySignupUsernames = unique(
    lotterySignupsForStartingTime.map(
      (lotterySignup) => lotterySignup.username,
    ),
  );

  // An attendee holding a lottery-placed spot in one of this run's own program items was placed
  // by a lottery - this one, or an earlier attempt that saved its spots and failed before saying
  // so. Saying they got nothing would be false, and neither the event log item nor the email can
  // be taken back. Asked of those program items rather than of the hour, so another lottery's win
  // cannot silence this one's rejection.
  const placedByLotteryResult = await findDirectSignupsByProgramItemIds([
    ...startingProgramItemIds,
  ]);
  if (!placedByLotteryResult.ok) {
    // The rejections still go out, keyed on this run's own results alone: silence for everyone
    // who lost is a certain harm, where telling a retry's already-placed attendee they got
    // nothing is a rare one, and only this hour's second attempt can produce it
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: failed to read the spots already placed, rejecting on this run's results alone`,
      ),
    );
  }
  const placedByLotteryUsernames = new Set(
    placedByLotteryResult.ok
      ? placedByLotteryResult.value.flatMap((directSignup) =>
          directSignup.userSignups
            .filter(
              (userSignup) => userSignup.priority !== DIRECT_SIGNUP_PRIORITY,
            )
            .map((userSignup) => userSignup.username),
        )
      : [],
  );

  // Use finalResults so users whose sign-up was dropped are treated as not assigned
  const placedNowUsernames = new Set(
    finalResults.map((result) => result.username),
  );

  const rejectedUsernames = lotterySignupUsernames.filter(
    (lotterySignupUsername) =>
      !placedNowUsernames.has(lotterySignupUsername) &&
      !placedByLotteryUsernames.has(lotterySignupUsername),
  );

  // Add NEW_ASSIGNMENT to user event logs
  const newAssignmentEventLogItemsResult = await addEventLogItems(
    finalResults.map((result) => ({
      username: result.username,
      programItemId: result.assignmentSignup.programItemId,
      programItemStartTime: result.assignmentSignup.signedToStartTime,
      createdAt: new Date().toISOString(),
      action: EventLogAction.NEW_ASSIGNMENT,
    })),
  );
  if (!newAssignmentEventLogItemsResult.ok) {
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: failed to add NEW_ASSIGNMENT event log items: ${newAssignmentEventLogItemsResult.error}`,
      ),
    );
  }

  // Add SEND_EMAIL_ACCEPTED to notification queue
  if (
    settings?.emailNotificationTrigger.includes(
      EmailNotificationTrigger.ACCEPTED,
    )
  ) {
    queueAssignmentEmails({
      queueService,
      assignmentTime,
      notifications: finalResults.map((result) => ({
        type: NotificationTaskType.SEND_EMAIL_ACCEPTED,
        username: result.username,
        programItemId: result.assignmentSignup.programItemId,
        programItemStartTime: result.assignmentSignup.signedToStartTime,
      })),
      emailKind: EmailNotificationTrigger.ACCEPTED,
    });
  }

  // Add NO_ASSIGNMENT to user event logs
  if (rejectedUsernames.length > 0) {
    // A batched lottery decides several starting times at once, so a rejection names the span
    // it took in rather than the hour the run was scheduled at, which for a batch is the
    // parent's
    const lotteriedSpan = getLotteriedSpan(
      startingProgramItems,
      assignmentTime,
    );

    const noAssignmentEventLogItemsResult = await addEventLogItems(
      rejectedUsernames.map((rejectedUsername) => ({
        username: rejectedUsername,
        programItemId: "",
        ...lotteriedSpan,
        createdAt: new Date().toISOString(),
        action: EventLogAction.NO_ASSIGNMENT,
      })),
    );
    if (!noAssignmentEventLogItemsResult.ok) {
      logger.error(
        new Error(
          `Assignment ${assignmentTime}: failed to add NO_ASSIGNMENT event log items: ${noAssignmentEventLogItemsResult.error}`,
        ),
      );
    }

    // Add SEND_EMAIL_REJECTED to notification queue
    if (
      settings?.emailNotificationTrigger.includes(
        EmailNotificationTrigger.REJECTED,
      )
    ) {
      queueAssignmentEmails({
        queueService,
        assignmentTime,
        notifications: rejectedUsernames.map((rejectedUsername) => ({
          type: NotificationTaskType.SEND_EMAIL_REJECTED,
          username: rejectedUsername,
          programItemId: "",
          ...lotteriedSpan,
        })),
        emailKind: EmailNotificationTrigger.REJECTED,
      });
    }
  }
};

interface QueueAssignmentEmailsParams {
  queueService: NotificationQueueService | null;
  assignmentTime: string;
  notifications: NotificationTask[];
  emailKind:
    | EmailNotificationTrigger.ACCEPTED
    | EmailNotificationTrigger.REJECTED;
}

const queueAssignmentEmails = ({
  queueService,
  assignmentTime,
  notifications,
  emailKind,
}: QueueAssignmentEmailsParams): void => {
  if (queueService === null) {
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: notification queue not initialized, skip queueing ${emailKind} emails`,
      ),
    );
    return;
  }

  const queueNotificationsResult =
    queueService.addNotificationsBulk(notifications);
  if (!queueNotificationsResult.ok) {
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: failed to queue ${emailKind} emails: ${queueNotificationsResult.error}`,
      ),
    );
  }
};

// Spread into the event log item and the email task, so the two span fields are either both
// written or both absent
type LotteriedSpan =
  | { programItemStartTime: string }
  | {
      programItemStartTime: string;
      lastProgramItemEndTime: string;
      programType: ProgramType;
    };

// Measured over the program items handed to it rather than over the run's own hour, which for
// a batch is the parent's and matches nothing the attendee saw
const getLotteriedSpan = (
  spanProgramItems: readonly ProgramItem[],
  assignmentTime: string,
): LotteriedSpan => {
  const firstProgramItem = firstBy(spanProgramItems, (programItem) =>
    new Date(programItem.startTime).getTime(),
  );
  // A run with no lottery program items at this starting time rejects nobody, so it never asks
  // for a span - the run's own hour is a fallback nothing reaches
  if (!firstProgramItem) {
    return { programItemStartTime: assignmentTime };
  }

  // To the minute, like every other start time comparison, so one instant written two ways
  // cannot read as a span
  const coversOneStartTime = spanProgramItems.every((programItem) =>
    isSameTime(programItem.startTime, firstProgramItem.startTime),
  );
  if (coversOneStartTime) {
    return { programItemStartTime: firstProgramItem.startTime };
  }

  // One program type names the whole span, so a run mixing them names none of them
  const coversOneProgramType = spanProgramItems.every(
    (programItem) => programItem.programType === firstProgramItem.programType,
  );
  if (!coversOneProgramType) {
    return { programItemStartTime: firstProgramItem.startTime };
  }

  // Seeded with the first program item so the list is non-empty by construction, which is what
  // makes the result a program item rather than a maybe
  const lastProgramItem = firstBy(
    [firstProgramItem, ...spanProgramItems],
    [(programItem) => new Date(programItem.endTime).getTime(), "desc"],
  );

  return {
    programItemStartTime: firstProgramItem.startTime,
    lastProgramItemEndTime: lastProgramItem.endTime,
    programType: firstProgramItem.programType,
  };
};
