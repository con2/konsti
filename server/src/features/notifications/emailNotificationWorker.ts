import { NotificationTask } from "server/utils/notificationQueue";
import { EmailSender, getEmailBody, getEmailSubject } from "./senderCommon";
import { findUser } from "../user/userRepository";
import { isErrorResult, unwrapResult } from "shared/utils/result";
import { logger } from "server/utils/logger";

export async function emailNotificationWorker (notification: NotificationTask, sender: EmailSender): Promise<void> {
    const userResult = await findUser(notification.username);
    if (isErrorResult(userResult)) {
        throw new Error(`Failed to fetch user to send email notification ${notification.username}.`);
    }

    const user = unwrapResult(userResult);

    if (!user) {
        throw new Error(`Trying to send email notification for unknown user ${notification.username}.`);
    }

    if (!user.email) {
        logger.error(`Trying to send email notifiction to user ${notification.username} without email address.`)
        return
    }

    const subject = getEmailSubject(notification);
    const body = getEmailBody(notification);
    const message = {
        from: "Mailgun Sandbox <postmaster@sandbox87d156be6f1947fc968496d5ae717ab6.mailgun.org>",
        to: [user.email],
        subject,
        body,
    };

    await sender.send(message);
    // Handler response
}