import dayjs from "dayjs";
import { NotificationTask } from "server/utils/notificationQueue";
import { TIMEZONE } from "shared/utils/initializeDayjs";

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const dateAndTimeFormat = "ddd D.M.YYYY HH:mm";

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
  // TODO: Should timeFormatter.ts be shared?
  // eslint-disable-next-line no-restricted-syntax
  const programStarttime = dayjs(notification.programItemStartTime)
    .tz(TIMEZONE)
    .format(dateAndTimeFormat);
  const bodyFi = `Hei ${notification.username}!
Olet ollut onnekas ja pääsit ohjelmaan ${programItemTitle}.
Ohjelma alkaa ${programStarttime}.`;
  const bodyEn = `Hi ${notification.username}!
You got spot on program ${programItemTitle}.
Program will start at ${programStarttime}.`;
  return `${bodyFi}\n\n${bodyEn}\n\nTerveisin / Sincerely Konsti`;
}
