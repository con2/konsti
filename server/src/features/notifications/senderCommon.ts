import { capitalize } from "remeda";
import { getProgramTypePluralName } from "shared/constants/programTypeNames";
import { Locale } from "shared/types/locale";
import { getDateAndTime } from "shared/utils/timeFormatter";
import { NotificationTask } from "server/utils/notificationQueue";

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

// Every message says the same thing twice, Finnish first, and signs off the same way. Kept
// here so the order and the blank lines between them cannot drift apart between messages
const buildEmailTemplate = (
  subject: string,
  bodyFi: string,
  bodyEn: string,
): EmailTemplate => ({
  subject,
  text: `${bodyFi}\n\n${bodyEn}\n\n${SIGNATURE}`,
});

export function getRejectedEmailTemplate(
  notification: NotificationTask,
): EmailTemplate {
  // One lottery can cover several starting times at once, and naming only the first would point
  // at one hour out of the several the attendee was competing across. Both ends carry their date,
  // since a span can end on a later day and a bare clock time would read as running backwards.
  const { lastProgramItemEndTime, programType } = notification;
  const lotteriedLine = (locale: Locale): string => {
    const from = getDateAndTime(notification.programItemStartTime, locale);
    if (!lastProgramItemEndTime || !programType) {
      return locale === Locale.FI
        ? `Paikat ${from} alkaviin ohjelmanumeroihin arvottiin.`
        : `Spots for program items starting at ${from} were randomized.`;
    }
    // Named the way the event log names it, so the inbox and the log tell one story
    const names = capitalize(getProgramTypePluralName(programType, locale));
    const until = getDateAndTime(lastProgramItemEndTime, locale);
    return locale === Locale.FI
      ? `${names} välillä ${from} - ${until} arvottiin.`
      : `${names} between ${from} and ${until} were lotteried.`;
  };

  const bodyFi = `Hei ${notification.username}!
${lotteriedLine(Locale.FI)}
Et valitettavasti päässyt arvonnassa yhteenkään ohjelmaan johon ilmoittauduit.`;
  const bodyEn = `Hi ${notification.username}!
${lotteriedLine(Locale.EN)}
Unfortunately you did not get a spot in the lottery sign-up.`;
  return buildEmailTemplate(SUBJECT, bodyFi, bodyEn);
}

export function getAcceptedEmailTemplate(
  programItemTitle: string,
  notification: NotificationTask,
): EmailTemplate {
  const programStartTimeFi = getDateAndTime(
    notification.programItemStartTime,
    Locale.FI,
  );
  const programStartTimeEn = getDateAndTime(
    notification.programItemStartTime,
    Locale.EN,
  );

  const bodyFi = `Hei ${notification.username}!
Olet ollut onnekas ja pääsit ohjelmaan ${programItemTitle}.
Ohjelma alkaa ${programStartTimeFi}.`;
  const bodyEn = `Hi ${notification.username}!
You got a spot in the program ${programItemTitle}.
The program will start at ${programStartTimeEn}.`;
  return buildEmailTemplate(SUBJECT, bodyFi, bodyEn);
}

export function getProgramItemCancelledEmailTemplate(
  notification: NotificationTask,
): EmailTemplate {
  const programStartTimeFi = getDateAndTime(
    notification.programItemStartTime,
    Locale.FI,
  );
  const programStartTimeEn = getDateAndTime(
    notification.programItemStartTime,
    Locale.EN,
  );

  const bodyFi = `Hei ${notification.username}!
Ohjelma ${notification.programItemTitle} on peruttu.
Ohjelman piti alkaa ${programStartTimeFi}.`;
  const bodyEn = `Hi ${notification.username}!
Program ${notification.programItemTitle} has been cancelled.
Program was supposed to start at ${programStartTimeEn}.`;
  return buildEmailTemplate(CANCELLED_DELETED_SUBJECT, bodyFi, bodyEn);
}

export function getProgramItemDeletedEmailTemplate(
  notification: NotificationTask,
): EmailTemplate {
  const programStartTimeFi = getDateAndTime(
    notification.programItemStartTime,
    Locale.FI,
  );
  const programStartTimeEn = getDateAndTime(
    notification.programItemStartTime,
    Locale.EN,
  );

  const bodyFi = `Hei ${notification.username}!
Ohjelma ${notification.programItemTitle} on poistettu ohjelmistosta.
Ohjelman piti alkaa ${programStartTimeFi}.`;
  const bodyEn = `Hi ${notification.username}!
Program ${notification.programItemTitle} has been removed from the program.
Program was supposed to start at ${programStartTimeEn}.`;
  return buildEmailTemplate(CANCELLED_DELETED_SUBJECT, bodyFi, bodyEn);
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
  return buildEmailTemplate(SIGNUP_CHANGED_SUBJECT, bodyFi, bodyEn);
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
  return buildEmailTemplate(SIGNUP_CHANGED_SUBJECT, bodyFi, bodyEn);
}

export function getProgramItemTimeChangedEmailTemplate(
  notification: NotificationTask,
): EmailTemplate {
  const programStartTimeFi = getDateAndTime(
    notification.programItemStartTime,
    Locale.FI,
  );
  const programStartTimeEn = getDateAndTime(
    notification.programItemStartTime,
    Locale.EN,
  );

  const bodyFi = `Hei ${notification.username}!
Ohjelman ${notification.programItemTitle} aikataulu on muuttunut.
Ohjelma alkaa nyt ${programStartTimeFi}.`;
  const bodyEn = `Hi ${notification.username}!
Program ${notification.programItemTitle} start time has changed.
The program will now start at ${programStartTimeEn}.`;
  return buildEmailTemplate(
    PROGRAM_STARTING_TIME_CHANGED_SUBJECT,
    bodyFi,
    bodyEn,
  );
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
