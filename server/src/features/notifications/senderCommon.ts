import { NotificationTask, NotificationTaskType } from "server/utils/notificationQueue"

export type EmailSendResponse = {
    id?: string,
    message?: string,
    status?: number
    details?: string
}

export type EmailMessage = {
    from: string,
    to: string[],
    subject: string,
    body: string,
}

export interface EmailSender {
    send: (message: EmailMessage) => Promise<EmailSendResponse>
}

export function getEmailSubject(notification: NotificationTask): string {
    switch (notification.type) {
        case NotificationTaskType.SEND_EMAIL_ACCEPTED:
            return `Sinut on hyvaksytty peliin ${notification.program}`;
        case NotificationTaskType.SEND_EMAIL_REJECTED:
            return "Et paassyt arvonnassa yhteenkaan peliin";
    }
}

export function getEmailBody(notification: NotificationTask): string {
    switch (notification.type) {
        case NotificationTaskType.SEND_EMAIL_ACCEPTED:
            return `Hei ${notification.username}!\nOlet ollut onnekas ja paasit peliin ${notification.program}\nPelin alkaa ${notification.programStartTime}.\n\nTerveisin Konsti.`;
        case NotificationTaskType.SEND_EMAIL_REJECTED:
            return `Hei ${notification.username}!\nEt paassyt peliin ${notification.programStartTime} arvonnassa\n\nTerveisin Konsti.`;
    }
}
