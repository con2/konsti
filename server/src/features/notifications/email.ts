import {
  createTestAccount,
  createTransport,
  getTestMessageUrl,
  Transporter,
} from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { config } from "shared/config";
import { EmailMessage } from "server/features/notifications/senderCommon";

export class EmailSender {
  private transport:
    | Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>
    | undefined;
  // Used for testing
  private sentMessages: EmailMessage[] = [];

  async getTransport(): Promise<
    Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>
  > {
    if (process.env.NODE_ENV === "production") {
      this.transport = createTransport({
        host: config.server().emailSMTPHost,
        port: config.server().emailSMTPPort,
      });
    } else {
      const account = await createTestAccount();
      this.transport = createTransport({
        host: config.server().emailSMTPHost,
        port: config.server().emailSMTPPort,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });
    }
    return this.transport;
  }

  getSentEmails(): EmailMessage[] {
    return this.sentMessages;
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    const transporter = await this.getTransport();
    const info = await transporter.sendMail(message);
    if (process.env.NODE_ENV !== "production") {
      this.sentMessages.push(message);
      // eslint-disable-next-line no-console
      console.log(getTestMessageUrl(info));
    }
  }
}
