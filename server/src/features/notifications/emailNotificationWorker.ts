import {
  NotificationTask,
  NotificationTaskType,
} from "server/utils/notificationQueue";
import {
  buildEmail,
  EmailMessage,
  getAcceptedEmailTemplate,
  getProgramItemCancelledEmailTemplate,
  getProgramItemDeletedEmailTemplate,
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
        new Error(
          `Failed to fetch user to send email notification ${notification.username}`,
        ),
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
  switch (notification.type) {
    case NotificationTaskType.SEND_EMAIL_ACCEPTED:
      return generateAcceptedEmail(email, fromAddress, notification);
    case NotificationTaskType.SEND_EMAIL_REJECTED:
      return generateRejectedEmail(email, fromAddress, notification);
    case NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_CANCELLED:
      return generateProgramItemCancelledEmail(
        email,
        fromAddress,
        notification,
      );
    case NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_DELETED:
      return generateProgramItemDeletedEmail(email, fromAddress, notification);
  }
}

async function generateAcceptedEmail(
  email: string,
  fromAddress: string,
  notification: NotificationTask,
): Promise<EmailMessage | null> {
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

function generateRejectedEmail(
  email: string,
  fromAddress: string,
  notification: NotificationTask,
): EmailMessage {
  return buildEmail(getRejectedEmailTemplate(notification), email, fromAddress);
}

function generateProgramItemCancelledEmail(
  email: string,
  fromAddress: string,
  notification: NotificationTask,
): EmailMessage | null {
  if (!notification.programItemTitle) {
    logger.error(
      `Missing programItemTitle for notification type ${notification.type}, username ${notification.username}`,
    );
    return null;
  }
  return buildEmail(
    getProgramItemCancelledEmailTemplate(notification),
    email,
    fromAddress,
  );
}

function generateProgramItemDeletedEmail(
  email: string,
  fromAddress: string,
  notification: NotificationTask,
): EmailMessage | null {
  if (!notification.programItemTitle) {
    logger.error(
      `Missing programItemTitle for notification type ${notification.type}, username ${notification.username}`,
    );
    return null;
  }
  return buildEmail(
    getProgramItemDeletedEmailTemplate(notification),
    email,
    fromAddress,
  );
}
