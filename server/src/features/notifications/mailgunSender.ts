import Mailgun from "mailgun.js";
import FormData from "form-data";
import { EmailMessage, EmailSender, EmailSendResponse } from "./senderCommon";

interface MailgunSenderParams {
  username: string;
  key: string;
  url: string;
  fromAddress: string;
  apiDomain: string;
}

export class MailgunSender implements EmailSender {
  private mailgun: Mailgun;
  private client;
  private fromAddress: string;
  private apiDomain: string;

  constructor(params: MailgunSenderParams) {
    const username = params.username;
    const key = params.key;
    const url = params.url;
    this.fromAddress = params.fromAddress;
    this.apiDomain = params.apiDomain;

    if (!username || !key || !url) {
      // eslint-disable-next-line no-restricted-syntax
      throw new Error("No username, key or url set for mailgun!");
    }

    this.mailgun = new Mailgun(FormData);
    this.client = this.mailgun.client({ username, key, url });
  }

  getFromAddress(): string {
    return this.fromAddress;
  }

  async send(message: EmailMessage): Promise<EmailSendResponse> {
    const data = await this.client.messages.create(this.apiDomain, {
      ...message,
      text: message.body,
    });
    return data;
  }
}
