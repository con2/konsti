import Mailgun from "mailgun.js";
import FormData from "form-data";
import { config } from "shared/config";
import { EmailMessage, EmailSender, EmailSendResponse } from "./senderCommon";

export class MailgunSender implements EmailSender {
  private mailgun: Mailgun;
  private client;

  constructor() {
    const username = config.server().mailgunUsername;
    const key = config.server().mailgunAPIKey;
    const url = config.server().mailgunURL;

    if (!username || !key || !url) {
      throw new Error("No username, key or url set for mailgun!");
    }

    this.mailgun = new Mailgun(FormData);
    this.client = this.mailgun.client({ username, key, url });
  }

  async send(message: EmailMessage): Promise<EmailSendResponse> {
    const data = await this.client.messages.create(
      "sandbox87d156be6f1947fc968496d5ae717ab6.mailgun.org",
      { ...message, text: message.body },
    );
    return data;
  }
}
