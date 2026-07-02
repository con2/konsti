import { logger } from "server/utils/logger";
import {
  getGlobalNotificationQueueService,
  NotificationTask,
  NotificationTaskType,
} from "server/utils/notificationQueue";
import { EventLogAction } from "shared/types/models/eventLog";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import { findSettings } from "server/features/settings/settingsRepository";
import { config } from "shared/config";

interface ProgramItemChangeUpdate {
  username: string;
  programItemId: string;
  programItemStartTime: string;
  action: EventLogAction;
}

export const queueCancelledDeletedEmails = async (
  updates: ProgramItemChangeUpdate[],
  programItemTitlesById: Map<string, string>,
): Promise<void> => {
  const settingsResult = await findSettings();
  let emailNotificationTrigger = config.server().emailNotificationTrigger;
  if (settingsResult.ok) {
    emailNotificationTrigger = settingsResult.value.emailNotificationTrigger;
  }

  const emailTasks = updates.flatMap((update): NotificationTask[] => {
    const base = {
      username: update.username,
      programItemId: update.programItemId,
      programItemStartTime: update.programItemStartTime,
      programItemTitle: programItemTitlesById.get(update.programItemId) ?? "",
    };
    if (
      update.action === EventLogAction.PROGRAM_ITEM_CANCELLED &&
      emailNotificationTrigger.includes(
        EmailNotificationTrigger.PROGRAM_ITEM_CANCELLED,
      )
    ) {
      return [
        {
          ...base,
          type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_CANCELLED,
        },
      ];
    }
    if (
      update.action === EventLogAction.PROGRAM_ITEM_DELETED &&
      emailNotificationTrigger.includes(
        EmailNotificationTrigger.PROGRAM_ITEM_DELETED,
      )
    ) {
      return [
        { ...base, type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_DELETED },
      ];
    }
    if (
      update.action === EventLogAction.PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE &&
      emailNotificationTrigger.includes(
        EmailNotificationTrigger.PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
      )
    ) {
      return [
        {
          ...base,
          type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
        },
      ];
    }
    if (
      update.action === EventLogAction.PROGRAM_ITEM_NO_LOTTERY_ANYMORE &&
      emailNotificationTrigger.includes(
        EmailNotificationTrigger.PROGRAM_ITEM_NO_LOTTERY_ANYMORE,
      )
    ) {
      return [
        {
          ...base,
          type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_NO_LOTTERY_ANYMORE,
        },
      ];
    }
    if (
      update.action === EventLogAction.PROGRAM_ITEM_MOVED &&
      emailNotificationTrigger.includes(
        EmailNotificationTrigger.PROGRAM_ITEM_TIME_CHANGED,
      )
    ) {
      return [
        {
          ...base,
          type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_TIME_CHANGED,
        },
      ];
    }
    return [];
  });

  if (emailTasks.length === 0) {
    return;
  }

  const queueService = getGlobalNotificationQueueService();
  if (queueService === null) {
    logger.warn(
      "Notification queue not initialized, skipping program item change emails",
    );
    return;
  }

  const queueResult = queueService.addNotificationsBulk(emailTasks);
  if (!queueResult.ok) {
    logger.error(
      new Error(
        "Failed to queue cancelled/deleted program item email notifications",
        { cause: queueResult.error },
      ),
    );
  }
};
