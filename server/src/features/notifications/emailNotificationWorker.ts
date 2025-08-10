import { NotificationTask, NotificationTaskType } from "server/utils/notificationQueue";
import { EmailMessage, EmailSender, getEmailBodyAccepted, getEmailBodyRejected, getEmailSubjectAccepted, getEmailSubjectRejected } from "./senderCommon";
import { findUser } from "../user/userRepository";
import { isErrorResult, unwrapResult } from "shared/utils/result";
import { logger } from "server/utils/logger";
import { findProgramItemById } from "../program-item/programItemRepository";

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

    const message = notification.type === NotificationTaskType.SEND_EMAIL_ACCEPTED ?
        await generateAcceptedEmail(user.email, notification)
        : await generateRejectedEmail(user.email, notification)

    await sender.send(message);
}

async function generateAcceptedEmail(email: string, notification: NotificationTask): Promise<EmailMessage> {
    const programItemResult = await findProgramItemById(notification.programItemId);
    if (isErrorResult(programItemResult)) {
        throw new Error(`Failed to found program for programItemId ${notification.programItemId}`);
    }
    const program = unwrapResult(programItemResult);

    const subject = getEmailSubjectAccepted(program.title);
    const body = getEmailBodyAccepted(program.title, notification);
    return {
        from: "Mailgun Sandbox <postmaster@sandbox87d156be6f1947fc968496d5ae717ab6.mailgun.org>",
        to: [email],
        subject,
        body,
    };
}

async function generateRejectedEmail(email: string, notification: NotificationTask): Promise<EmailMessage> {
    const subject = getEmailSubjectRejected();
    const body = getEmailBodyRejected(notification);
    return {
        from: "Mailgun Sandbox <postmaster@sandbox87d156be6f1947fc968496d5ae717ab6.mailgun.org>",
        to: [email],
        subject,
        body,
    };
}