import { NotificationTask } from "server/utils/notificationQueue"

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

export function getEmailSubjectRejected(): string {
    return "Et paassyt arvonnassa yhteenkaan ohjelmaan";
}

export function getEmailSubjectAccepted(programItemTitle: string): string {
    return `Sinut on hyvaksytty ohjelmaan ${programItemTitle}`;
}

export function getEmailBodyRejected(notification: NotificationTask): string {
    return `Hei ${notification.username}!\nEt paassyt arvonnassa yhteenkaan ohjelmaan johon ilmoittauduit.\n\nTerveisin Konsti.`;
}

export function getEmailBodyAccepted(programItemTitle: string, notification: NotificationTask): string {
    return `Hei ${notification.username}!\nOlet ollut onnekas ja paasit ohjelmaan ${programItemTitle}\nOhjelma alkaa ${notification.programItemStartTime}.\n\nTerveisin Konsti.`;
}
