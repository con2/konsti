import { NotificationTask } from "server/utils/notificationQueue";
import { getDateAndTimeWithLocale } from "shared/utils/timeFormatter";

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface EmailTemplate {
  subject: string;
  text: string;
}

const SUBJECT = "Konstiarvonnan tulos / Results for Konsti lottery signup";
const SIGNATURE = "Terveisin / Sincerely Konsti";

export function getRejectedEmailTemplate(
  notification: NotificationTask,
): EmailTemplate {
  const bodyFi = `Hei ${notification.username}!
Et valitettavasti päässyt arvonnassa yhteenkään ohjelmaan johon ilmoittauduit.`;
  const bodyEn = `Hi ${notification.username}!
Unfortunately you did not get spot on lottery signup.`;
  return {
    subject: SUBJECT,
    text: `${bodyFi}\n\n${bodyEn}\n\n${SIGNATURE}`,
  };
}

export function getAcceptedEmailTemplate(
  programItemTitle: string,
  notification: NotificationTask,
): EmailTemplate {
  const programStartTimeFi = getDateAndTimeWithLocale(
    notification.programItemStartTime,
    "fi",
  );
  const programStartTimeEn = getDateAndTimeWithLocale(
    notification.programItemStartTime,
    "en",
  );

  const bodyFi = `Hei ${notification.username}!
Olet ollut onnekas ja pääsit ohjelmaan ${programItemTitle}.
Ohjelma alkaa ${programStartTimeFi}.`;
  const bodyEn = `Hi ${notification.username}!
You got spot on program ${programItemTitle}.
Program will start at ${programStartTimeEn}.`;
  return {
    subject: SUBJECT,
    text: `${bodyFi}\n\n${bodyEn}\n\n${SIGNATURE}`,
  };
}

export function buildEmail(
  template: EmailTemplate,
  to: string,
  from: string,
): EmailMessage {
  return {
    from,
    to,
    subject: template.subject,
    text: template.text,
    html: `<p>${template.text.replaceAll("\n", "<br />")}</p>`,
  };
}
