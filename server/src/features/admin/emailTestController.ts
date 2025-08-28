import { Request, Response } from "express";
import { z } from "zod";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { UserGroup } from "shared/types/models/user";
import { getAuthorizedUsername } from "server/utils/authHeader";
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

const PostEmailTestSchema = z.object({
  email: z.string().email(),
  notificationType: z.nativeEnum(EmailNotificationTrigger),
  programId: z.string().min(1, "Program ID is required"),
});

export const postEmailTest = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.EMAIL_TEST}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostEmailTestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "Error validating postEmailTest body: %s",
      JSON.stringify(result.error),
    );
    return res.sendStatus(422);
  }

  const { email, notificationType, programId } = result.data;

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
      message = {
        from: config.server().emailSendFromAddress,
        to: email,
        subject: getEmailSubjectAccepted(),
        text: getEmailBodyAccepted("Test Program Item", mockNotification),
        html: getEmailBodyAccepted("Test Program Item", mockNotification),
      };
    } else if (notificationType === EmailNotificationTrigger.REJECTED) {
      const mockNotification: NotificationTask = {
        type: NotificationTaskType.SEND_EMAIL_REJECTED,
        username: "test-user",
        programItemId: programId,
        programItemStartTime: new Date().toISOString(),
      };
      message = {
        from: config.server().emailSendFromAddress,
        to: email,
        subject: getEmailSubjectRejected(),
        text: getEmailBodyRejected(mockNotification),
        html: getEmailBodyRejected(mockNotification),
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
