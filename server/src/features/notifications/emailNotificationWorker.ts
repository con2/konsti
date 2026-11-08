import { config } from "shared/config";
import { EMAIL_REGEX } from "shared/constants/validation";
import { EmailSender } from "server/features/notifications/email";
import { findProgramItemById } from "server/features/program-item/programItemRepository";
import { findUserByUserId } from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import {
  EmailNotification,
  NotificationTask,
  NotificationTaskType,
} from "server/utils/notificationQueue";
import {
  EmailMessage,
  buildEmail,
  getAcceptedEmailTemplate,
  getProgramItemCancelledEmailTemplate,
  getProgramItemDeletedEmailTemplate,
  getProgramItemNoKonstiSignupEmailTemplate,
  getProgramItemNoLotteryEmailTemplate,
  getProgramItemTimeChangedEmailTemplate,
  getRejectedEmailTemplate,
} from "./senderCommon";

export enum EmailNotificationOutcome {
  SENT = "sent",
  // The attendee has no valid email address, so there is nothing to send
  SKIPPED = "skipped",
  FAILED = "failed",
}

export async function emailNotificationWorker(
  sender: EmailSender,
  notification: NotificationTask,
): Promise<EmailNotificationOutcome> {
  try {
    const userResult = await findUserByUserId(notification.userId);
    if (!userResult.ok) {
      logger.error(
        new Error(
          `Failed to fetch user to send email notification ${notification.userId}`,
        ),
      );
      return EmailNotificationOutcome.FAILED;
    }

    const user = userResult.value;

    if (!user) {
      logger.error(
        new Error(
          `Trying to send email notification for unknown user ${notification.userId}.`,
        ),
      );
      return EmailNotificationOutcome.FAILED;
    }

    if (!user.email || !EMAIL_REGEX.test(user.email)) {
      return EmailNotificationOutcome.SKIPPED;
    }

    const message = await generateEmail(user.email, {
      ...notification,
      username: user.username,
    });
    if (message === null) {
      return EmailNotificationOutcome.FAILED;
    }
    await sender.sendEmail(message);
    return EmailNotificationOutcome.SENT;
  } catch (error) {
    logger.error(
      new Error("Unexpected error in sending email notification", {
        cause: error,
      }),
    );
    return EmailNotificationOutcome.FAILED;
  }
}

async function generateEmail(
  email: string,
  notification: EmailNotification,
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
    case NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE:
      return generateProgramItemNoKonstiSignupEmail(
        email,
        fromAddress,
        notification,
      );
    case NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_NO_LOTTERY_ANYMORE:
      return generateProgramItemNoLotteryEmail(
        email,
        fromAddress,
        notification,
      );
    case NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_TIME_CHANGED:
      return generateProgramItemTimeChangedEmail(
        email,
        fromAddress,
        notification,
      );
  }
}

async function generateAcceptedEmail(
  email: string,
  fromAddress: string,
  notification: EmailNotification,
): Promise<EmailMessage | null> {
  const programItemResult = await findProgramItemById(
    notification.programItemId,
  );
  if (!programItemResult.ok) {
    logger.error(
      new Error(
        `Failed to find program item for programItemId ${notification.programItemId}`,
      ),
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
  notification: EmailNotification,
): EmailMessage {
  return buildEmail(getRejectedEmailTemplate(notification), email, fromAddress);
}

function generateProgramItemCancelledEmail(
  email: string,
  fromAddress: string,
  notification: EmailNotification,
): EmailMessage | null {
  if (!notification.programItemTitle) {
    logger.error(
      new Error(
        `Missing programItemTitle for notification type ${notification.type}, username ${notification.username}`,
      ),
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
  notification: EmailNotification,
): EmailMessage | null {
  if (!notification.programItemTitle) {
    logger.error(
      new Error(
        `Missing programItemTitle for notification type ${notification.type}, username ${notification.username}`,
      ),
    );
    return null;
  }
  return buildEmail(
    getProgramItemDeletedEmailTemplate(notification),
    email,
    fromAddress,
  );
}

function generateProgramItemNoKonstiSignupEmail(
  email: string,
  fromAddress: string,
  notification: EmailNotification,
): EmailMessage | null {
  if (!notification.programItemTitle) {
    logger.error(
      new Error(
        `Missing programItemTitle for notification type ${notification.type}, username ${notification.username}`,
      ),
    );
    return null;
  }
  return buildEmail(
    getProgramItemNoKonstiSignupEmailTemplate(notification),
    email,
    fromAddress,
  );
}

function generateProgramItemNoLotteryEmail(
  email: string,
  fromAddress: string,
  notification: EmailNotification,
): EmailMessage | null {
  if (!notification.programItemTitle) {
    logger.error(
      new Error(
        `Missing programItemTitle for notification type ${notification.type}, username ${notification.username}`,
      ),
    );
    return null;
  }
  return buildEmail(
    getProgramItemNoLotteryEmailTemplate(notification),
    email,
    fromAddress,
  );
}

function generateProgramItemTimeChangedEmail(
  email: string,
  fromAddress: string,
  notification: EmailNotification,
): EmailMessage | null {
  if (!notification.programItemTitle) {
    logger.error(
      new Error(
        `Missing programItemTitle for notification type ${notification.type}, username ${notification.username}`,
      ),
    );
    return null;
  }
  return buildEmail(
    getProgramItemTimeChangedEmailTemplate(notification),
    email,
    fromAddress,
  );
}
