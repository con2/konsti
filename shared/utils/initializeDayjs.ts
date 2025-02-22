import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from "dayjs/plugin/advancedFormat";

export const TIMEZONE = "Europe/Helsinki";

export const initializeDayjs = (): void => {
  dayjs.extend(isBetween);
  dayjs.extend(isSameOrAfter);
  dayjs.extend(isSameOrBefore);
  dayjs.extend(relativeTime);
  dayjs.extend(updateLocale);
  dayjs.extend(utc); // Required by timezone
  dayjs.extend(timezone);
  dayjs.extend(advancedFormat);

  dayjs.tz.setDefault(TIMEZONE);

  dayjs.updateLocale("en", {
    relativeTime: {
      future: "in %s",
      past: "%s ago",
      s: "a few seconds",
      m: "a minute",
      mm: "%d minutes",
      h: "an hour",
      hh: "%d hours",
      d: "a day",
      dd: "%d days",
      M: "a month",
      MM: "%d months",
      y: "a year",
      yy: "%d years",
    },
  });

  dayjs.updateLocale("fi", {
    relativeTime: {
      future: "%s päästä",
      past: "%s sitten",
      s: processRelativeTime,
      m: processRelativeTime,
      mm: processRelativeTime,
      h: processRelativeTime,
      hh: processRelativeTime,
      d: processRelativeTime,
      dd: processRelativeTime,
      M: processRelativeTime,
      MM: processRelativeTime,
      y: processRelativeTime,
      yy: processRelativeTime,
    },
  });
};

const processRelativeTime = (
  number: string,
  _withoutSuffix: boolean,
  key: string,
  isFuture: boolean,
): string => {
  const format: Record<string, [string, string]> = {
    s: ["muutama sekunti", "muutaman sekunnin"],
    m: ["minuutti", "minuutin"],
    mm: [number + " minuuttia", number + " minuutin"],
    h: ["tunti", "tunnin"],
    hh: [number + " tuntia", number + " tunnin"],
    d: ["päivä", "päivän"],
    dd: [number + " päivää", number + " päivän"],
    M: ["kuukausi", "kuukauden"],
    MM: [number + " kuukautta", number + " kuukauden"],
    y: ["vuosi", "vuoden"],
    yy: [number + " vuotta", number + " vuoden"],
  };
  return isFuture ? format[key][1] : format[key][0];
};
