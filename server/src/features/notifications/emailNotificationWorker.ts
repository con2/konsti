import { NotificationTask } from "server/utils/notificationQueue";
import { EmailSender, getEmailBody, getEmailSubject } from "./senderCommon";

export async function emailNotificationWorker (notification: NotificationTask, sender: EmailSender): Promise<void> {
    const subject = getEmailSubject(notification)
    const body = getEmailBody(notification)
    const message = {
        from: "Mailgun Sandbox <postmaster@sandbox87d156be6f1947fc968496d5ae717ab6.mailgun.org>",
        to: [],
        subject,
        body,
    }

    await sender.send(message)
    // Handler response
}