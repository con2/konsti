import {
  Transporter,
  createTestAccount,
  createTransport,
  getTestMessageUrl,
} from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { config } from "shared/config";
import { EmailMessage } from "server/features/notifications/senderCommon";
import { logger } from "server/utils/logger";

export enum EmailDelivery {
  // Batches the app sends by itself, a lottery run's worth at a time
  QUEUED = "queued",
  // One message an admin asked for, so it is worth a round trip to read
  ADMIN_TEST = "adminTest",
}

export class EmailSender {
  private transport:
    | Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>
    | undefined;
  // Used for testing
  private sentMessages: EmailMessage[] = [];
  private readonly delivery: EmailDelivery;

  constructor(delivery: EmailDelivery = EmailDelivery.QUEUED) {
    this.delivery = delivery;
  }

  async getTransport(): Promise<
    Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>
  > {
    if (this.transport) {
      return this.transport;
    }
    if (process.env.SETTINGS === "production") {
      this.transport = createTransport({
        host: config.server().emailSMTPHost,
        port: config.server().emailSMTPPort,
      });
    } else if (
      this.delivery === EmailDelivery.ADMIN_TEST &&
      process.env.NODE_ENV !== "test"
    ) {
      const account = await createTestAccount();
      this.transport = createTransport({
        host: config.server().emailSMTPHost,
        port: config.server().emailSMTPPort,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });
    } else {
      // The non-production host is a shared free service that rate limits, so a lottery
      // run's worth of notifications is rejected wholesale and each rejection is logged as
      // an error. Nothing but the admin's own test message needs delivering outside
      // production, and the addresses staging holds are generated ones
      this.transport = createTransport({ jsonTransport: true });
    }
    return this.transport;
  }

  getSentEmails(): EmailMessage[] {
    return this.sentMessages;
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    const transporter = await this.getTransport();
    const info = await transporter.sendMail(message);

    // Retained for tests to assert on. Anywhere else this is a long-lived process holding
    // every message it ever built
    if (process.env.NODE_ENV === "test") {
      this.sentMessages.push(message);
      return;
    }

    const previewUrl = getTestMessageUrl(info);
    if (previewUrl) {
      // eslint-disable-next-line no-console
      console.log(previewUrl);
      return;
    }

    if (process.env.SETTINGS !== "production") {
      logger.info(
        `Email to ${message.to} not delivered outside production: ${message.subject}`,
      );
    }
  }
}
