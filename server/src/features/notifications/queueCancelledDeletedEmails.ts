import { logger } from "server/utils/logger";
import {
  getGlobalNotificationQueueService,
  NotificationTaskType,
} from "server/utils/notificationQueue";
import { EventLogAction } from "shared/types/models/eventLog";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import { findSettings } from "server/features/settings/settingsRepository";
import { config } from "shared/config";

interface CancelledDeletedUpdate {
  username: string;
  programItemId: string;
  programItemStartTime: string;
  action: EventLogAction;
}

export const queueCancelledDeletedEmails = async (
  updates: CancelledDeletedUpdate[],
  programItemTitlesById: Map<string, string>,
): Promise<void> => {
  const settingsResult = await findSettings();
  let emailNotificationTrigger = config.server().emailNotificationTrigger;
  if (settingsResult.ok) {
    emailNotificationTrigger = settingsResult.value.emailNotificationTrigger;
  }

  const emailUpdates = updates.filter(
    (update) =>
      (update.action === EventLogAction.PROGRAM_ITEM_CANCELLED &&
        emailNotificationTrigger.includes(
          EmailNotificationTrigger.PROGRAM_ITEM_CANCELLED,
        )) ||
      (update.action === EventLogAction.PROGRAM_ITEM_DELETED &&
        emailNotificationTrigger.includes(
          EmailNotificationTrigger.PROGRAM_ITEM_DELETED,
        )),
  );
  if (emailUpdates.length === 0) {
    return;
  }

  const queueService = getGlobalNotificationQueueService();
  if (queueService === null) {
    logger.warn(
      "Notification queue not initialized, skipping cancelled/deleted program item emails",
    );
    return;
  }

  const queueResult = queueService.addNotificationsBulk(
    emailUpdates.map((update) => ({
      type:
        update.action === EventLogAction.PROGRAM_ITEM_CANCELLED
          ? NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_CANCELLED
          : NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_DELETED,
      username: update.username,
      programItemId: update.programItemId,
      programItemStartTime: update.programItemStartTime,
      programItemTitle: programItemTitlesById.get(update.programItemId) ?? "",
    })),
  );
  if (!queueResult.ok) {
    logger.error(
      new Error(
        "Failed to queue cancelled/deleted program item email notifications",
        { cause: queueResult.error },
      ),
    );
  }
};
