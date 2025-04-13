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
            return "Sinut on hyvaksytty peliin";
        case NotificationTaskType.SEND_EMAIL_REJECTED:
            return "Sinua ei hyvaksytty peliin";
    }
}

export function getEmailBody(notification: NotificationTask): string {
    switch (notification.type) {
        case NotificationTaskType.SEND_EMAIL_ACCEPTED:
            return "Hei pelaaja!\nOlet ollut onnekas ja paasit haluamaasi peliin.\nPelin lisatiedot lisataan tahan myohemmin.\n\nTerveisin Konsti.";
        case NotificationTaskType.SEND_EMAIL_REJECTED:
            return "Hei pelaaja!\nEt paassyt peliin. Huono saka. Seuraavalla kerralla paremmin.\n\nTerveisin Konsti.";
    }
}
