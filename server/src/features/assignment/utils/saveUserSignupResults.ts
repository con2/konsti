import dayjs from "dayjs";
import { unique } from "remeda";
import { logger } from "server/utils/logger";
import {
  getGlobalNotificationQueueService,
  NotificationQueueService,
  NotificationTask,
  NotificationTaskType,
} from "server/utils/notificationQueue";
import { UserAssignmentResult } from "shared/types/models/result";
import {
  delDirectSignups,
  delAssignmentDirectSignupsByStartTime,
  findDirectSignupsByStartTime,
  saveDirectSignups,
} from "server/features/direct-signup/directSignupRepository";
import { Result, makeSuccessResult } from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import {
  addEventLogItems,
  deleteEventLogItemsByStartTime,
} from "server/features/user/event-log/eventLogRepository";
import { EventLogAction } from "shared/types/models/eventLog";
import { getLotterySignups } from "server/features/assignment/utils/getLotterySignups";
import { User } from "shared/types/models/user";
import { getGroupCreators } from "server/features/assignment/utils/getGroupCreators";
import { getGroupMembersWithCreatorLotterySignups } from "server/features/assignment/utils/getGroupMembers";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { ProgramItem } from "shared/types/models/programItem";
import { SignupRepositoryAddSignup } from "server/features/direct-signup/directSignupTypes";
import { isStartTimeMatch } from "server/utils/isStartTimeMatch";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import { findSettings } from "server/features/settings/settingsRepository";
import { Settings } from "shared/types/models/settings";

interface SaveUserSignupResultsParams {
  assignmentTime: string;
  results: readonly UserAssignmentResult[];
  users: User[];
  programItems: ProgramItem[];
}

export const saveUserSignupResults = async ({
  assignmentTime,
  results,
  users,
  programItems,
}: SaveUserSignupResultsParams): Promise<Result<void, MongoDbError>> => {
  // Remove previous lottery result for the same start time
  // This does not remove non-lottery signups or previous signups from moved program items
  const delAssignmentSignupsByStartTimeResult =
    await delAssignmentDirectSignupsByStartTime(assignmentTime, programItems);
  if (!delAssignmentSignupsByStartTimeResult.ok) {
    return delAssignmentSignupsByStartTimeResult;
  }

  // Only non-lottery signups and previous signups from moved program items should be remaining
  const directSignupsByStartTimeResult = await findDirectSignupsByStartTime(
    assignmentTime,
    programItems,
  );
  if (!directSignupsByStartTimeResult.ok) {
    return directSignupsByStartTimeResult;
  }
  // Resolve conflicting existing direct signups
  // If user has existing signups...
  // ... and new assignment result -> remove existing
  // ... and no new assignment result -> keep existing
  // A user can hold several signups at the same start time (e.g. an always-open item plus a
  // moved-in one), so remove every one of theirs, not just the first
  const signupsToDelete = results.flatMap((result) =>
    directSignupsByStartTimeResult.value
      .filter((signup) => signup.username === result.username)
      .map((signup) => ({
        username: signup.username,
        directSignupProgramItemId: signup.programItemId,
      })),
  );

  const delDirectSignupsResult = await delDirectSignups(signupsToDelete);
  if (!delDirectSignupsResult.ok) {
    return delDirectSignupsResult;
  }

  // Save new assignment results
  const newSignups: SignupRepositoryAddSignup[] = results.map((result) => {
    return {
      username: result.username,
      directSignupProgramItemId: result.assignmentSignup.programItemId,
      // assignmentTime can be parent-resolved; direct signups store parent time for lottery re-run cleanup
      signedToStartTime: assignmentTime,
      signupTime: dayjs().toISOString(),
      // Signups received from assignment don't have signup messages
      message: "",
      priority: result.assignmentSignup.priority,
    };
  });

  // This might drop some signups if by some error too many signups are passed for a program item
  const saveSignupsResult = await saveDirectSignups(newSignups, programItems);
  if (!saveSignupsResult.ok) {
    return saveSignupsResult;
  }
  const { droppedSignups } = saveSignupsResult.value;

  // Filter out possible dropped results
  const finalResults = results.filter((result) => {
    return droppedSignups.every(
      (signup) =>
        signup.directSignupProgramItemId !==
          result.assignmentSignup.programItemId ||
        signup.username !== result.username,
    );
  });

  // The assignment seats are saved at this point, notification failures are
  // handled inside and don't fail the run
  await addAssignmentNotifications({
    assignmentTime,
    finalResults,
    users,
    programItems,
  });

  return makeSuccessResult();
};

interface AddAssignmentNotificationsParams {
  assignmentTime: string;
  finalResults: readonly UserAssignmentResult[];
  users: User[];
  programItems: ProgramItem[];
}

// The assignment seats are already saved when this runs, so failures are only
// logged and never returned: an error escaping to the caller would fail the
// run and skip the overlap lottery signup cleanup
const addAssignmentNotifications = async ({
  assignmentTime,
  finalResults,
  users,
  programItems,
}: AddAssignmentNotificationsParams): Promise<void> => {
  const queueService = getGlobalNotificationQueueService();

  const settingsResult = await findSettings();
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

  // Remove eventLog items from same start time
  const deleteEventLogItemsByStartTimeResult =
    await deleteEventLogItemsByStartTime(assignmentTime, [
      EventLogAction.NEW_ASSIGNMENT,
      EventLogAction.NO_ASSIGNMENT,
    ]);
  if (!deleteEventLogItemsByStartTimeResult.ok) {
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: failed to delete previous assignment event log items: ${deleteEventLogItemsByStartTimeResult.error}`,
      ),
    );
  }

  // Add NEW_ASSIGNMENT to user event logs
  const newAssignmentEventLogItemsResult = await addEventLogItems(
    finalResults.map((result) => ({
      username: result.username,
      programItemId: result.assignmentSignup.programItemId,
      programItemStartTime: assignmentTime,
      createdAt: dayjs().toISOString(),
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

  // Get users who didn't get a seat in lottery
  const startingProgramItems = getStartingProgramItems(
    programItems,
    assignmentTime,
  );
  const groupCreators = getGroupCreators(users, startingProgramItems);
  const groupMembers = getGroupMembersWithCreatorLotterySignups(
    groupCreators,
    users,
  );
  const allAttendees = [...groupCreators, ...groupMembers];
  const lotterySignups = getLotterySignups(allAttendees);

  const lotterySignupsForStartingTime = lotterySignups.filter(
    (lotterySignup) => {
      const programItem = startingProgramItems.find(
        (startingProgramItem) =>
          startingProgramItem.programItemId === lotterySignup.programItemId,
      );
      return isStartTimeMatch(
        lotterySignup.signedToStartTime,
        assignmentTime,
        programItem?.parentId,
      );
    },
  );

  const lotterySignupUsernames = unique(
    lotterySignupsForStartingTime.map(
      (lotterySignup) => lotterySignup.username,
    ),
  );

  const noAssignmentLotterySignupUsernames = lotterySignupUsernames.flatMap(
    (lotterySignupUsername) => {
      // Use finalResults so users whose signup was dropped are treated as not assigned
      const userGotAssignment = finalResults.some(
        (result) => result.username === lotterySignupUsername,
      );
      if (!userGotAssignment) {
        return lotterySignupUsername;
      }
      return [];
    },
  );

  // Add NO_ASSIGNMENT to user event logs
  if (noAssignmentLotterySignupUsernames.length > 0) {
    const noAssignmentEventLogItemsResult = await addEventLogItems(
      noAssignmentLotterySignupUsernames.map(
        (noAssignmentLotterySignupUsername) => ({
          username: noAssignmentLotterySignupUsername,
          programItemId: "",
          programItemStartTime: assignmentTime,
          createdAt: dayjs().toISOString(),
          action: EventLogAction.NO_ASSIGNMENT,
        }),
      ),
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
        notifications: noAssignmentLotterySignupUsernames.map(
          (noAssignmentLotterySignupUsername) => ({
            type: NotificationTaskType.SEND_EMAIL_REJECTED,
            username: noAssignmentLotterySignupUsername,
            programItemId: "",
            programItemStartTime: assignmentTime,
          }),
        ),
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
