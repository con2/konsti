import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import {
  buildEmail,
  EmailMessage,
  getAcceptedEmailTemplate,
  getRejectedEmailTemplate,
} from "server/features/notifications/senderCommon";
import { EmailSender } from "server/features/notifications/email";
import { config } from "shared/config";
import {
  NotificationTask,
  NotificationTaskType,
} from "server/utils/notificationQueue";
import { PostEmailTestRequest } from "shared/test-types/api/testData";

export const postEmailTest = async (
  req: Request<unknown, unknown, PostEmailTestRequest>,
  res: Response,
): Promise<Response> => {
  const { email, notificationType, programId } = req.body;

  try {
    const emailSender = new EmailSender();

    let message: EmailMessage;

    const fromAddress = config.server().emailSendFromAddress;
    if (notificationType === EmailNotificationTrigger.ACCEPTED) {
      const mockNotification: NotificationTask = {
        type: NotificationTaskType.SEND_EMAIL_ACCEPTED,
        username: "test-user",
        programItemId: programId,
        programItemStartTime: new Date().toISOString(),
      };
      message = buildEmail(
        getAcceptedEmailTemplate("Test Program Item", mockNotification),
        email,
        fromAddress,
      );
    } else if (notificationType === EmailNotificationTrigger.REJECTED) {
      const mockNotification: NotificationTask = {
        type: NotificationTaskType.SEND_EMAIL_REJECTED,
        username: "test-user",
        programItemId: programId,
        programItemStartTime: new Date().toISOString(),
      };
      message = buildEmail(
        getRejectedEmailTemplate(mockNotification),
        email,
        fromAddress,
      );
    } else {
      return res.status(400).json({ message: "Invalid notification type" });
    }

    await emailSender.sendEmail(message);

    logger.info(
      `Test email sent to ${email} for notification type ${notificationType}`,
    );
    return res.status(200).json({ message: "Test email sent successfully" });
  } catch (error) {
    logger.error("Failed to send test email: %s", error);
    return res.status(500).json({ message: "Failed to send test email" });
  }
};
