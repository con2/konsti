import { isSameMinute } from "date-fns";
import { unique } from "remeda";
import { MongoDbError } from "shared/types/api/errors";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramItem } from "shared/types/models/programItem";
import { UserAssignmentResult } from "shared/types/models/result";
import { Settings } from "shared/types/models/settings";
import { User } from "shared/types/models/user";
import { Result, makeSuccessResult } from "shared/utils/result";
import { getGroupCreators } from "server/features/assignment/utils/getGroupCreators";
import { getGroupMembersWithCreatorLotterySignups } from "server/features/assignment/utils/getGroupMembers";
import { getLotterySignups } from "server/features/assignment/utils/getLotterySignups";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import {
  delDirectSignups,
  findDirectSignupsByStartTime,
  saveDirectSignups,
} from "server/features/direct-signup/directSignupRepository";
import { SignupRepositoryAddSignup } from "server/features/direct-signup/directSignupTypes";
import { findOrCreateSettings } from "server/features/settings/settingsRepository";
import {
  addEventLogItems,
  deleteEventLogItemsByStartTime,
} from "server/features/user/event-log/eventLogRepository";
import { isStartTimeMatch } from "server/utils/isStartTimeMatch";
import { logger } from "server/utils/logger";
import {
  NotificationQueueService,
  NotificationTask,
  NotificationTaskType,
  getGlobalNotificationQueueService,
} from "server/utils/notificationQueue";

interface SaveUserSignupResultsParams {
  assignmentTime: string;
  results: readonly UserAssignmentResult[];
  users: User[];
  settledAttendeeUsernames: ReadonlySet<string>;
  programItems: ProgramItem[];
}

export const saveUserSignupResults = async ({
  assignmentTime,
  results,
  users,
  settledAttendeeUsernames,
  programItems,
  // Returns the results that actually landed: saveDirectSignups can drop a sign-up that no
  // longer fits, and the caller must not record those attendees as placed
}: SaveUserSignupResultsParams): Promise<
  Result<readonly UserAssignmentResult[], MongoDbError>
> => {
  // Existing direct sign-ups for this start time are left in place. Attendees already
  // holding one are kept out of the run, so the results only name attendees who need one
  const directSignupsByStartTimeResult = await findDirectSignupsByStartTime(
    assignmentTime,
    programItems,
  );
  if (!directSignupsByStartTimeResult.ok) {
    return directSignupsByStartTimeResult;
  }
  // Resolve conflicting existing direct sign-ups
  // If user has existing sign-ups...
  // ... and new assignment result -> remove existing
  // ... and no new assignment result -> keep existing
  // A user can hold several sign-ups at the same start time (e.g. an always-open item plus a
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
      // assignmentTime can be parent-resolved; direct sign-ups store the parent time so a
      // sign-up in a batched program item is found by lookups for the batch's start time
      signedToStartTime: assignmentTime,
      signupTime: new Date().toISOString(),
      // Sign-ups received from assignment don't have sign-up messages
      message: "",
      priority: result.assignmentSignup.priority,
    };
  });

  // This might drop some sign-ups if by some error too many sign-ups are passed for a program item
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

  // The assignment spots are saved at this point, notification failures are
  // handled inside and don't fail the run
  await addAssignmentNotifications({
    assignmentTime,
    finalResults,
    users,
    settledAttendeeUsernames,
    programItems,
  });

  return makeSuccessResult(finalResults);
};

interface AddAssignmentNotificationsParams {
  assignmentTime: string;
  finalResults: readonly UserAssignmentResult[];
  users: User[];
  settledAttendeeUsernames: ReadonlySet<string>;
  programItems: ProgramItem[];
}

// The assignment spots are already saved when this runs, so failures are only
// logged and never returned: an error escaping to the caller would fail the
// run and skip the overlap lottery sign-up cleanup
const addAssignmentNotifications = async ({
  assignmentTime,
  finalResults,
  users,
  settledAttendeeUsernames,
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

  // Users who already have a NO_ASSIGNMENT event log for this start time, ie. a previous
  // run could not place them. Read from the pre-run snapshot, before the rewrite below
  const alreadyRejectedUsernames = new Set(
    users
      .filter((user) =>
        user.eventLogItems.some(
          (eventLogItem) =>
            eventLogItem.action === EventLogAction.NO_ASSIGNMENT &&
            isSameMinute(
              new Date(eventLogItem.programItemStartTime),
              new Date(assignmentTime),
            ),
        ),
      )
      .map((user) => user.username),
  );

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
  const expandedAttendees = [...groupCreators, ...groupMembers];

  // Attendees who already held a spot were kept out of the run, so the lottery never
  // considered them. They are not rejected and must not be told they missed out
  const allAttendees = expandedAttendees.filter(
    (attendee) => !settledAttendeeUsernames.has(attendee.username),
  );
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
      // Use finalResults so users whose sign-up was dropped are treated as not assigned
      const userGotAssignment = finalResults.some(
        (result) => result.username === lotterySignupUsername,
      );
      if (!userGotAssignment) {
        return lotterySignupUsername;
      }
      return [];
    },
  );

  // Keep re-runs idempotent: only notify users newly rejected this run. Users
  // who already have a NO_ASSIGNMENT log from an earlier run are not re-notified
  const newlyRejectedUsernames = noAssignmentLotterySignupUsernames.filter(
    (username) => !alreadyRejectedUsernames.has(username),
  );

  // Rewrite this start time's log items for the attendees whose outcome this run decided,
  // so a re-run can't leave anyone holding two "you got a spot" entries, or a "no spot"
  // entry next to a "you got a spot" one. Scoped to their usernames, so attendees sitting
  // the run out keep the entries from the run that decided them, and an attendee already
  // rejected and rejected again keeps the entry they may have read rather than a fresh one
  const placedUsernames = finalResults.map((result) => result.username);
  const decidedUsernames = [...placedUsernames, ...newlyRejectedUsernames];
  if (decidedUsernames.length > 0) {
    const deletePreviousItemsResult = await deleteEventLogItemsByStartTime(
      assignmentTime,
      [EventLogAction.NEW_ASSIGNMENT, EventLogAction.NO_ASSIGNMENT],
      decidedUsernames,
    );
    if (!deletePreviousItemsResult.ok) {
      logger.error(
        new Error(
          `Assignment ${assignmentTime}: failed to delete previous assignment event log items: ${deletePreviousItemsResult.error}`,
        ),
      );
    }
  }

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
  if (newlyRejectedUsernames.length > 0) {
    const noAssignmentEventLogItemsResult = await addEventLogItems(
      newlyRejectedUsernames.map((newlyRejectedUsername) => ({
        username: newlyRejectedUsername,
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
        notifications: newlyRejectedUsernames.map((newlyRejectedUsername) => ({
          type: NotificationTaskType.SEND_EMAIL_REJECTED,
          username: newlyRejectedUsername,
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
