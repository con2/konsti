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

const SUBJECT = "Konsti-arvonnan tulos / Results for Konsti lottery sign-up";
const CANCELLED_DELETED_SUBJECT = "Ohjelma peruttu / Program cancelled";
const SIGNUP_CHANGED_SUBJECT =
  "Ohjelman ilmoittautuminen muuttunut / Program sign-up method changed";
const PROGRAM_STARTING_TIME_CHANGED_SUBJECT =
  "Ohjelman aika muuttunut / Program time changed";
const SIGNATURE = "Terveisin / Sincerely Konsti";

export function getRejectedEmailTemplate(
  notification: NotificationTask,
): EmailTemplate {
  const lotteryStartTimeFi = getDateAndTimeWithLocale(
    notification.programItemStartTime,
    "fi",
  );
  const lotteryStartTimeEn = getDateAndTimeWithLocale(
    notification.programItemStartTime,
    "en",
  );

  const bodyFi = `Hei ${notification.username}!
Paikat ${lotteryStartTimeFi} alkaviin ohjelmanumeroihin arvottiin.
Et valitettavasti päässyt arvonnassa yhteenkään ohjelmaan johon ilmoittauduit.`;
  const bodyEn = `Hi ${notification.username}!
Spots for program items starting at ${lotteryStartTimeEn} were randomized.
Unfortunately you did not get a spot in the lottery sign-up.`;
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
You got a spot in the program ${programItemTitle}.
The program will start at ${programStartTimeEn}.`;
  return {
    subject: SUBJECT,
    text: `${bodyFi}\n\n${bodyEn}\n\n${SIGNATURE}`,
  };
}

export function getProgramItemCancelledEmailTemplate(
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
Ohjelma ${notification.programItemTitle} on peruttu.
Ohjelman piti alkaa ${programStartTimeFi}.`;
  const bodyEn = `Hi ${notification.username}!
Program ${notification.programItemTitle} has been cancelled.
Program was supposed to start at ${programStartTimeEn}.`;
  return {
    subject: CANCELLED_DELETED_SUBJECT,
    text: `${bodyFi}\n\n${bodyEn}\n\n${SIGNATURE}`,
  };
}

export function getProgramItemDeletedEmailTemplate(
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
Ohjelma ${notification.programItemTitle} on poistettu ohjelmistosta.
Ohjelman piti alkaa ${programStartTimeFi}.`;
  const bodyEn = `Hi ${notification.username}!
Program ${notification.programItemTitle} has been removed from the program.
Program was supposed to start at ${programStartTimeEn}.`;
  return {
    subject: CANCELLED_DELETED_SUBJECT,
    text: `${bodyFi}\n\n${bodyEn}\n\n${SIGNATURE}`,
  };
}

export function getProgramItemNoKonstiSignupEmailTemplate(
  notification: NotificationTask,
): EmailTemplate {
  const bodyFi = `Hei ${notification.username}!
Ohjelma ${notification.programItemTitle} ei enää käytä Konsti-ilmoittautumista.
Ilmoittautumisesi ohjelmaan on poistettu.`;
  const bodyEn = `Hi ${notification.username}!
Program ${notification.programItemTitle} no longer uses Konsti sign-up.
Your sign-up for the program has been removed.`;
  return {
    subject: SIGNUP_CHANGED_SUBJECT,
    text: `${bodyFi}\n\n${bodyEn}\n\n${SIGNATURE}`,
  };
}

export function getProgramItemNoLotteryEmailTemplate(
  notification: NotificationTask,
): EmailTemplate {
  const bodyFi = `Hei ${notification.username}!
Ohjelma ${notification.programItemTitle} ei enää käytä arvontailmoittautumista.
Arvontailmoittautumisesi ohjelmaan on poistettu.`;
  const bodyEn = `Hi ${notification.username}!
Program ${notification.programItemTitle} no longer uses lottery sign-up.
Your lottery sign-up for the program has been removed.`;
  return {
    subject: SIGNUP_CHANGED_SUBJECT,
    text: `${bodyFi}\n\n${bodyEn}\n\n${SIGNATURE}`,
  };
}

export function getProgramItemTimeChangedEmailTemplate(
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
Ohjelman ${notification.programItemTitle} aikataulu on muuttunut.
Ohjelma alkaa nyt ${programStartTimeFi}.`;
  const bodyEn = `Hi ${notification.username}!
Program ${notification.programItemTitle} start time has changed.
The program will now start at ${programStartTimeEn}.`;
  return {
    subject: PROGRAM_STARTING_TIME_CHANGED_SUBJECT,
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
