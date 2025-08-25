import {
  NotificationTask,
  NotificationTaskType,
} from "server/utils/notificationQueue";
import {
  EmailMessage,
  getEmailBodyAccepted,
  getEmailBodyRejected,
  getEmailSubjectAccepted,
  getEmailSubjectRejected,
} from "./senderCommon";
import { isErrorResult, unwrapResult } from "shared/utils/result";
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
    if (isErrorResult(userResult)) {
      logger.error(
        `Failed to fetch user to send email notification ${notification.username}.`,
      );
      return;
    }

    const user = unwrapResult(userResult);

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
      logger.error(
        `Trying to send email notifiction to user ${notification.username} without email address.`,
      );
      return;
    }

    const message =
      notification.type === NotificationTaskType.SEND_EMAIL_ACCEPTED
        ? await generateAcceptedEmail(
            user.email,
            notification,
            config.server().emailSendFromAddress,
          )
        : generateRejectedEmail(
            user.email,
            notification,
            config.server().emailSendFromAddress,
          );
    if (message !== null) {
      await sender.sendEmail(message);
    }
  } catch (error) {
    logger.error("Unexpected error in sending email notification: %s", error);
  }
  return;
}

async function generateAcceptedEmail(
  email: string,
  notification: NotificationTask,
  fromAddress: string,
): Promise<EmailMessage | null> {
  const programItemResult = await findProgramItemById(
    notification.programItemId,
  );
  if (isErrorResult(programItemResult)) {
    logger.error(
      `Failed to found program for programItemId ${notification.programItemId}`,
    );
    return null;
  }
  const program = unwrapResult(programItemResult);

  const subject = getEmailSubjectAccepted(program.title);
  const body = getEmailBodyAccepted(program.title, notification);
  return {
    from: fromAddress,
    to: email,
    subject,
    text: body,
    html: body,
  };
}

function generateRejectedEmail(
  email: string,
  notification: NotificationTask,
  fromAddress: string,
): EmailMessage {
  const subject = getEmailSubjectRejected();
  const body = getEmailBodyRejected(notification);
  return {
    from: fromAddress,
    to: email,
    subject,
    text: body,
    html: body,
  };
}
