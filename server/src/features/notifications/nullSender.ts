import { EmailMessage, EmailSender, EmailSendResponse } from "./senderCommon";

export class NullSender implements EmailSender {
  private out: EmailMessage[] = [];

  getMessages(): EmailMessage[] {
    return this.out;
  }

  getFromAddress(): string {
    return "";
  }

  async send(message: EmailMessage): Promise<EmailSendResponse> {
    this.out.push(message);
    return new Promise({
      id: "1",
      message: "",
      details: "",
      status: 200,
    });
  }
}
