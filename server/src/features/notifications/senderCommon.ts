import { NotificationTask } from "server/utils/notificationQueue";
import { getDateAndTimeWithLocale } from "shared/utils/timeFormatter";

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export function getEmailSubjectRejected(): string {
  return "Konstiarvonnan tulos / Results for Konsti lottery signup";
}

export function getEmailSubjectAccepted(): string {
  return "Konstiarvonnan tulos / Results for Konsti lottery signup";
}

export function getEmailBodyRejected(notification: NotificationTask): string {
  const bodyFi = `Hei ${notification.username}!
Et valitettavasti päässyt arvonnassa yhteenkään ohjelmaan johon ilmoittauduit.`;
  const bodyEn = `Hi ${notification.username}!
Unfortunately you did not get spot on lottery signup.`;
  return `${bodyFi}\n\n${bodyEn}\n\nTerveisin / Sincerely Konsti`;
}

export function getEmailBodyAccepted(
  programItemTitle: string,
  notification: NotificationTask,
): string {
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
  return `${bodyFi}\n\n${bodyEn}\n\nTerveisin / Sincerely Konsti`;
}
