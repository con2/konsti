import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import {
  buildEmail,
  EmailMessage,
  getAcceptedEmailTemplate,
  getProgramItemCancelledEmailTemplate,
  getProgramItemDeletedEmailTemplate,
  getRejectedEmailTemplate,
} from "server/features/notifications/senderCommon";
import { EmailSender } from "server/features/notifications/email";
import { config } from "shared/config";
import {
  NotificationTask,
  NotificationTaskType,
} from "server/utils/notificationQueue";
import { PostEmailTestRequest } from "shared/test-types/api/testData";
import { EmailNotificationTrigger } from "shared/types/emailNotification";

export const postEmailTest = async (
  req: Request<unknown, unknown, PostEmailTestRequest>,
  res: Response,
): Promise<Response> => {
  const { email, notificationType, programId } = req.body;

  try {
    const fromAddress = config.server().emailSendFromAddress;
    const baseMockNotification = {
      username: "test-user",
      programItemId: programId,
      programItemStartTime: new Date().toISOString(),
    };

    let message: EmailMessage;

    switch (notificationType) {
      case EmailNotificationTrigger.ACCEPTED: {
        const mockNotification: NotificationTask = {
          ...baseMockNotification,
          type: NotificationTaskType.SEND_EMAIL_ACCEPTED,
        };
        message = buildEmail(
          getAcceptedEmailTemplate("Test Program Item", mockNotification),
          email,
          fromAddress,
        );
        break;
      }
      case EmailNotificationTrigger.REJECTED: {
        const mockNotification: NotificationTask = {
          ...baseMockNotification,
          type: NotificationTaskType.SEND_EMAIL_REJECTED,
        };
        message = buildEmail(
          getRejectedEmailTemplate(mockNotification),
          email,
          fromAddress,
        );
        break;
      }
      case EmailNotificationTrigger.PROGRAM_ITEM_CANCELLED: {
        const mockNotification: NotificationTask = {
          ...baseMockNotification,
          type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_CANCELLED,
          programItemTitle: "Test Program Item",
        };
        message = buildEmail(
          getProgramItemCancelledEmailTemplate(mockNotification),
          email,
          fromAddress,
        );
        break;
      }
      case EmailNotificationTrigger.PROGRAM_ITEM_DELETED: {
        const mockNotification: NotificationTask = {
          ...baseMockNotification,
          type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_DELETED,
          programItemTitle: "Test Program Item",
        };
        message = buildEmail(
          getProgramItemDeletedEmailTemplate(mockNotification),
          email,
          fromAddress,
        );
        break;
      }
      default:
        return res.status(400).json({ message: "Invalid notification type" });
    }

    const emailSender = new EmailSender();
    await emailSender.sendEmail(message);

    logger.info(
      `Test email sent to ${email} for notification type ${notificationType}`,
    );
    return res.status(200).json({ message: "Test email sent successfully" });
  } catch (error) {
    logger.error(new Error("Failed to send test email", { cause: error }));
    return res.status(500).json({ message: "Failed to send test email" });
  }
};
