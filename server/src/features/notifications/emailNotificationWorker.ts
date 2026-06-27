import {
  NotificationTask,
  NotificationTaskType,
} from "server/utils/notificationQueue";
import {
  buildEmail,
  EmailMessage,
  getAcceptedEmailTemplate,
  getRejectedEmailTemplate,
} from "./senderCommon";
import { logger } from "server/utils/logger";
import { findUser } from "server/features/user/userRepository";
import { findProgramItemById } from "server/features/program-item/programItemRepository";
import { config } from "shared/config";
import { EmailSender } from "server/features/notifications/email";

export async function emailNotificationWorker(
  sender: EmailSender,
  notification: NotificationTask,
): Promise<void> {
  try {
    const userResult = await findUser(notification.username);
    if (!userResult.ok) {
      logger.error(
        `Failed to fetch user to send email notification ${notification.username}.`,
      );
      return;
    }

    const user = userResult.value;

    if (!user) {
      logger.error(
        `Trying to send email notification for unknown user ${notification.username}.`,
      );
      return;
    }

    if (
      !user.email ||
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(user.email)
    ) {
      return;
    }

    const message = await generateEmail(user.email, notification);
    if (message !== null) {
      await sender.sendEmail(message);
    }
  } catch (error) {
    logger.error(
      new Error("Unexpected error in sending email notification", {
        cause: error,
      }),
    );
  }
  return;
}

async function generateEmail(
  email: string,
  notification: NotificationTask,
): Promise<EmailMessage | null> {
  const fromAddress = config.server().emailSendFromAddress;

  if (notification.type === NotificationTaskType.SEND_EMAIL_ACCEPTED) {
    const programItemResult = await findProgramItemById(
      notification.programItemId,
    );
    if (!programItemResult.ok) {
      logger.error(
        `Failed to found program for programItemId ${notification.programItemId}`,
      );
      return null;
    }
    const template = getAcceptedEmailTemplate(
      programItemResult.value.title,
      notification,
    );
    return buildEmail(template, email, fromAddress);
  }

  const template = getRejectedEmailTemplate(notification);
  return buildEmail(template, email, fromAddress);
}
