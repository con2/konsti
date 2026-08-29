import { unique } from "remeda";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramItem } from "shared/types/models/programItem";
import { UserAssignmentResult } from "shared/types/models/result";
import { Settings } from "shared/types/models/settings";
import { User } from "shared/types/models/user";
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

  // Get users who didn't get a spot in lottery
  const startingProgramItems = getStartingProgramItems(
    programItems,
    assignmentTime,
  );
  const groupCreators = getGroupCreators(users, startingProgramItems);
  const groupMembers = getGroupMembersWithCreatorLotterySignups(
    groupCreators,
    users,
  );
  // Everyone with a live lottery sign-up for this start time took part, so everyone hears the
  // outcome - including an attendee who already holds a spot at that hour. The lottery really
  // did consider them and really did not place them
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
  // by a lottery - this run, or one that saved its spots and then failed before saying so, which
  // choice 7 allows to be run again. Telling them they got nothing would be false, and choice 5
  // means the event log item and the email could never be taken back. Asked of those program
  // items rather than of the hour, so another lottery's win cannot silence this one's rejection
  const placedByLotteryResult = await findDirectSignupsByProgramItemIds([
    ...startingProgramItemIds,
  ]);
  if (!placedByLotteryResult.ok) {
    // Without it a rejection cannot be told from a placement, and a wrong one is permanent
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: failed to read the spots already placed, skip queueing rejections`,
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

  const rejectedUsernames = placedByLotteryResult.ok
    ? lotterySignupUsernames.filter(
        (lotterySignupUsername) =>
          !placedNowUsernames.has(lotterySignupUsername) &&
          !placedByLotteryUsernames.has(lotterySignupUsername),
      )
    : [];

  // Add NEW_ASSIGNMENT to user event logs
  const newAssignmentEventLogItemsResult = await addEventLogItems(
    finalResults.map((result) => ({
      username: result.username,
      programItemId: result.assignmentSignup.programItemId,
      programItemStartTime: assignmentTime,
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
    const noAssignmentEventLogItemsResult = await addEventLogItems(
      rejectedUsernames.map((rejectedUsername) => ({
        username: rejectedUsername,
        programItemId: "",
        programItemStartTime: assignmentTime,
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
          programItemStartTime: assignmentTime,
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
