import { EmailMessage, EmailSender, EmailSendResponse } from "./senderCommon";

export class NullSender implements EmailSender {
    async send(message: EmailMessage): Promise<EmailSendResponse> {
        return {
            id: "1",
            message: "",
            details: "",
            status: 200
        }
    }
}
