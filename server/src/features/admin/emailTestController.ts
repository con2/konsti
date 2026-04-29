import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import {
  EmailMessage,
  getEmailBodyAccepted,
  getEmailBodyRejected,
  getEmailSubjectAccepted,
  getEmailSubjectRejected,
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

    if (notificationType === EmailNotificationTrigger.ACCEPTED) {
      const mockNotification: NotificationTask = {
        type: NotificationTaskType.SEND_EMAIL_ACCEPTED,
        username: "test-user",
        programItemId: programId,
        programItemStartTime: new Date().toISOString(),
      };
      const body = getEmailBodyAccepted("Test Program Item", mockNotification);
      const htmlBody = body.replaceAll("\n", "<br />");
      message = {
        from: config.server().emailSendFromAddress,
        to: email,
        subject: getEmailSubjectAccepted(),
        text: body,
        html: htmlBody,
      };
    } else if (notificationType === EmailNotificationTrigger.REJECTED) {
      const mockNotification: NotificationTask = {
        type: NotificationTaskType.SEND_EMAIL_REJECTED,
        username: "test-user",
        programItemId: programId,
        programItemStartTime: new Date().toISOString(),
      };
      const body = getEmailBodyRejected(mockNotification);
      const htmlBody = body.replaceAll("\n", "<br />");
      message = {
        from: config.server().emailSendFromAddress,
        to: email,
        subject: getEmailSubjectRejected(),
        text: body,
        html: htmlBody,
      };
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
