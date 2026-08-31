import { TestAccount, createTestAccount, createTransport } from "nodemailer";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import {
  EmailDelivery,
  EmailSender,
} from "server/features/notifications/email";
import { EmailMessage } from "server/features/notifications/senderCommon";

// createTransport is passed through so a message really goes through the chosen transport;
// createTestAccount is not, because the real one calls Ethereal's API over the network
vi.mock("nodemailer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("nodemailer")>();
  return {
    ...actual,
    createTransport: vi.fn(actual.createTransport),
    createTestAccount: vi.fn(),
  };
});

const testMessage: EmailMessage = {
  from: "Konsti <konsti@kompassi.eu>",
  to: "attendee@example.com",
  subject: "Konsti-arvonnan tulos",
  text: "Body",
};

const testAccount = {
  user: "ethereal-user",
  pass: "ethereal-pass",
  smtp: { host: "smtp.ethereal.email", port: 587, secure: false },
  imap: { host: "imap.ethereal.email", port: 993, secure: true },
  pop3: { host: "pop3.ethereal.email", port: 995, secure: true },
  web: "https://ethereal.email",
} satisfies TestAccount;

beforeEach(() => {
  vi.mocked(createTransport).mockClear();
  vi.mocked(createTestAccount).mockReset();
  vi.mocked(createTestAccount).mockResolvedValue(testAccount);
  // How a deployed pod runs: only SETTINGS tells staging and production apart
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SETTINGS", "staging");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Queued notifications outside production", () => {
  test("should not be put on the network", async () => {
    await new EmailSender().sendEmail(testMessage);

    expect(createTransport).toHaveBeenCalledWith({ jsonTransport: true });
  });

  test("should not ask the shared test service for an account", async () => {
    await new EmailSender().sendEmail(testMessage);

    expect(createTestAccount).not.toHaveBeenCalled();
  });

  test("should not be retained by a long-lived process", async () => {
    const sender = new EmailSender();
    await sender.sendEmail(testMessage);

    expect(sender.getSentEmails()).toEqual([]);
  });
});

describe("Admin test message outside production", () => {
  test("should be delivered through the configured SMTP host", async () => {
    await new EmailSender(EmailDelivery.ADMIN_TEST).getTransport();

    expect(createTransport).toHaveBeenCalledWith({
      host: config.server().emailSMTPHost,
      port: config.server().emailSMTPPort,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  });
});

describe("Production", () => {
  beforeEach(() => {
    vi.stubEnv("SETTINGS", "production");
  });

  test("should send queued notifications through the configured SMTP host", async () => {
    await new EmailSender().getTransport();

    expect(createTransport).toHaveBeenCalledWith({
      host: config.server().emailSMTPHost,
      port: config.server().emailSMTPPort,
    });
  });
});
