import { add } from "date-fns";
import { beforeAll, describe, expect, test } from "vitest";
import { Locale } from "shared/types/locale";
import { setLocale } from "shared/utils/setLocale";
import {
  formatProgramItemDuration,
  formatRelativeTime,
  formattedCurrentTime,
  getDate,
  getDateAndTime,
  getShortDate,
  getShortWeekdayAndTime,
  getTime,
  getTimezone,
  getWeekdayAndTime,
} from "shared/utils/timeFormatter";

// Every output here is user visible, so these assertions are a byte-for-byte
// contract rather than a sanity check. The DST instants sit either side of the
// Europe/Helsinki transitions, where a formatter that leaked the host timezone
// would produce an hour that looks plausible but is wrong.
const WINTER = "2026-01-15T10:30:00Z"; // Thu, GMT+2
const SUMMER = "2026-07-15T10:30:00Z"; // Wed, GMT+3
const MARCH_DST_BEFORE = "2026-03-29T00:59:00Z"; // Sun 02:59, last minute of GMT+2
const MARCH_DST_AFTER = "2026-03-29T01:00:00Z"; // Sun 04:00, clocks jumped forward
const OCTOBER_DST_BEFORE = "2026-10-25T00:59:00Z"; // Sun 03:59, last minute of GMT+3
const OCTOBER_DST_AFTER = "2026-10-25T01:00:00Z"; // Sun 03:00, clocks fell back
const MIDNIGHT = "2026-02-10T22:00:00Z"; // Wed 00:00 local, previous day in UTC
const YEAR_END = "2026-12-31T21:59:30Z"; // Thu 23:59:30 local

describe("Locale independent formatting", () => {
  beforeAll(() => {
    setLocale(Locale.EN);
  });

  test.each([
    [WINTER, "15.1.2026"],
    [SUMMER, "15.7.2026"],
    [MARCH_DST_AFTER, "29.3.2026"],
    [OCTOBER_DST_AFTER, "25.10.2026"],
    [MIDNIGHT, "11.2.2026"],
    [YEAR_END, "31.12.2026"],
  ])("getDate(%s) is %s", (time, expected) => {
    expect(getDate(time)).toEqual(expected);
  });

  test.each([
    [WINTER, "12:30"],
    [SUMMER, "13:30"],
    [MARCH_DST_BEFORE, "02:59"],
    [MARCH_DST_AFTER, "04:00"],
    [OCTOBER_DST_BEFORE, "03:59"],
    [OCTOBER_DST_AFTER, "03:00"],
    [MIDNIGHT, "00:00"],
    [YEAR_END, "23:59"],
  ])("getTime(%s) is %s", (time, expected) => {
    expect(getTime(time)).toEqual(expected);
  });

  test.each([
    [WINTER, "GMT+2"],
    [SUMMER, "GMT+3"],
    [MARCH_DST_BEFORE, "GMT+2"],
    [MARCH_DST_AFTER, "GMT+3"],
    [OCTOBER_DST_BEFORE, "GMT+3"],
    [OCTOBER_DST_AFTER, "GMT+2"],
  ])("getTimezone(%s) is %s", (time, expected) => {
    expect(getTimezone(time)).toEqual(expected);
  });

  test.each([
    [WINTER, "12:30:00"],
    [SUMMER, "13:30:00"],
    [YEAR_END, "23:59:30"],
  ])("formattedCurrentTime(%s) is %s", (time, expected) => {
    expect(formattedCurrentTime(new Date(time))).toEqual(expected);
  });

  test.each([
    [0, " "],
    [30, " 30 min"],
    [60, "1 h "],
    [90, "1 h 30 min"],
    [240, "4 h "],
  ])("formatProgramItemDuration(%s) is '%s'", (mins, expected) => {
    expect(formatProgramItemDuration(mins)).toEqual(expected);
  });
});

describe("EN locale formatting", () => {
  beforeAll(() => {
    setLocale(Locale.EN);
  });

  test.each([
    [WINTER, "Thursday 12:30"],
    [SUMMER, "Wednesday 13:30"],
    [MARCH_DST_BEFORE, "Sunday 02:59"],
    [MARCH_DST_AFTER, "Sunday 04:00"],
    [OCTOBER_DST_BEFORE, "Sunday 03:59"],
    [OCTOBER_DST_AFTER, "Sunday 03:00"],
    [MIDNIGHT, "Wednesday 00:00"],
  ])("getWeekdayAndTime(%s) is %s", (time, expected) => {
    expect(getWeekdayAndTime(time)).toEqual(expected);
  });

  test.each([
    [WINTER, "Thu 15.1."],
    [SUMMER, "Wed 15.7."],
    [MARCH_DST_AFTER, "Sun 29.3."],
    [MIDNIGHT, "Wed 11.2."],
  ])("getShortDate(%s) is %s", (time, expected) => {
    expect(getShortDate(time)).toEqual(expected);
  });

  test.each([
    [WINTER, "Thu 12:30"],
    [SUMMER, "Wed 13:30"],
    [OCTOBER_DST_AFTER, "Sun 03:00"],
    [MIDNIGHT, "Wed 00:00"],
  ])("getShortWeekdayAndTime(%s) is %s", (time, expected) => {
    expect(getShortWeekdayAndTime(time)).toEqual(expected);
  });

  test.each([
    [WINTER, "Thu 15.1.2026 12:30"],
    [SUMMER, "Wed 15.7.2026 13:30"],
    [OCTOBER_DST_AFTER, "Sun 25.10.2026 03:00"],
    [YEAR_END, "Thu 31.12.2026 23:59"],
  ])("getDateAndTime(%s) is %s", (time, expected) => {
    expect(getDateAndTime(time)).toEqual(expected);
  });
});

describe("FI locale formatting", () => {
  beforeAll(() => {
    setLocale(Locale.FI);
  });

  test.each([
    [WINTER, "torstai 12:30"],
    [SUMMER, "keskiviikko 13:30"],
    [MARCH_DST_BEFORE, "sunnuntai 02:59"],
    [MARCH_DST_AFTER, "sunnuntai 04:00"],
    [OCTOBER_DST_BEFORE, "sunnuntai 03:59"],
    [OCTOBER_DST_AFTER, "sunnuntai 03:00"],
    [MIDNIGHT, "keskiviikko 00:00"],
  ])("getWeekdayAndTime(%s) is %s", (time, expected) => {
    expect(getWeekdayAndTime(time)).toEqual(expected);
  });

  test.each([
    [WINTER, "to 15.1."],
    [SUMMER, "ke 15.7."],
    [MARCH_DST_AFTER, "su 29.3."],
    [MIDNIGHT, "ke 11.2."],
  ])("getShortDate(%s) is %s", (time, expected) => {
    expect(getShortDate(time)).toEqual(expected);
  });

  test.each([
    [WINTER, "to 12:30"],
    [SUMMER, "ke 13:30"],
    [OCTOBER_DST_AFTER, "su 03:00"],
    [MIDNIGHT, "ke 00:00"],
  ])("getShortWeekdayAndTime(%s) is %s", (time, expected) => {
    expect(getShortWeekdayAndTime(time)).toEqual(expected);
  });

  test.each([
    [WINTER, "to 15.1.2026 12:30"],
    [SUMMER, "ke 15.7.2026 13:30"],
    [OCTOBER_DST_AFTER, "su 25.10.2026 03:00"],
    [YEAR_END, "to 31.12.2026 23:59"],
  ])("getDateAndTime(%s) is %s", (time, expected) => {
    expect(getDateAndTime(time)).toEqual(expected);
  });
});

// Takes the locale as an argument rather than reading the global one, so it has
// to stay correct while the global locale says otherwise
describe("getDateAndTime", () => {
  beforeAll(() => {
    setLocale(Locale.EN);
  });

  test.each([
    [WINTER, Locale.FI, "to 15.1.2026 12:30"],
    [SUMMER, Locale.FI, "ke 15.7.2026 13:30"],
    [WINTER, Locale.EN, "Thu 15.1.2026 12:30"],
    [SUMMER, Locale.EN, "Wed 15.7.2026 13:30"],
  ])("(%s, %s) is %s", (time, locale, expected) => {
    expect(getDateAndTime(time, locale)).toEqual(expected);
  });
});

describe("Relative time", () => {
  // The event log stamps each entry with a relative time for its first four hours,
  // so these strings are user visible. date-fns produces them, and pinning them
  // here catches a locale update rewording what attendees see
  const timeNow = new Date("2019-07-26T17:00:00Z");

  type Unit =
    | "second"
    | "seconds"
    | "minute"
    | "minutes"
    | "hour"
    | "hours"
    | "day"
    | "days"
    | "month"
    | "months"
    | "year"
    | "years";

  const shifted = (number: number, key: Unit): Date =>
    add(timeNow, { [key.endsWith("s") ? key : `${key}s`]: number });

  const relativeTimePast = (number: number, key: Unit): string => {
    return formatRelativeTime(shifted(number, key), timeNow);
  };

  const relativeTimeFuture = (number: number, key: Unit): string => {
    return formatRelativeTime(timeNow, shifted(number, key));
  };

  test("Format EN relative times correctly", () => {
    setLocale(Locale.EN);

    expect(relativeTimePast(1, "second")).toEqual("less than a minute ago");
    expect(relativeTimePast(2, "seconds")).toEqual("less than a minute ago");

    expect(relativeTimePast(1, "minute")).toEqual("1 minute ago");
    expect(relativeTimePast(2, "minutes")).toEqual("2 minutes ago");

    expect(relativeTimePast(1, "hour")).toEqual("about 1 hour ago");
    expect(relativeTimePast(2, "hours")).toEqual("about 2 hours ago");

    expect(relativeTimePast(1, "day")).toEqual("1 day ago");
    expect(relativeTimePast(2, "days")).toEqual("2 days ago");

    expect(relativeTimePast(1, "month")).toEqual("about 1 month ago");
    expect(relativeTimePast(2, "months")).toEqual("2 months ago");

    expect(relativeTimePast(1, "year")).toEqual("about 1 year ago");
    expect(relativeTimePast(2, "years")).toEqual("about 2 years ago");

    expect(relativeTimeFuture(1, "second")).toEqual("in less than a minute");
    expect(relativeTimeFuture(2, "seconds")).toEqual("in less than a minute");

    expect(relativeTimeFuture(1, "minute")).toEqual("in 1 minute");
    expect(relativeTimeFuture(2, "minutes")).toEqual("in 2 minutes");

    expect(relativeTimeFuture(1, "hour")).toEqual("in about 1 hour");
    expect(relativeTimeFuture(2, "hours")).toEqual("in about 2 hours");

    expect(relativeTimeFuture(1, "day")).toEqual("in 1 day");
    expect(relativeTimeFuture(2, "days")).toEqual("in 2 days");

    expect(relativeTimeFuture(1, "month")).toEqual("in about 1 month");
    expect(relativeTimeFuture(2, "months")).toEqual("in 2 months");

    expect(relativeTimeFuture(1, "year")).toEqual("in about 1 year");
    expect(relativeTimeFuture(2, "years")).toEqual("in about 2 years");
  });

  test("Format FI relative times correctly", () => {
    setLocale(Locale.FI);

    expect(relativeTimePast(1, "second")).toEqual("alle minuutti sitten");
    expect(relativeTimePast(2, "seconds")).toEqual("alle minuutti sitten");

    expect(relativeTimePast(1, "minute")).toEqual("minuutti sitten");
    expect(relativeTimePast(2, "minutes")).toEqual("2 minuuttia sitten");

    expect(relativeTimePast(1, "hour")).toEqual("noin tunti sitten");
    expect(relativeTimePast(2, "hours")).toEqual("noin 2 tuntia sitten");

    expect(relativeTimePast(1, "day")).toEqual("päivä sitten");
    expect(relativeTimePast(2, "days")).toEqual("2 päivää sitten");

    expect(relativeTimePast(1, "month")).toEqual("noin kuukausi sitten");
    expect(relativeTimePast(2, "months")).toEqual("2 kuukautta sitten");

    expect(relativeTimePast(1, "year")).toEqual("noin vuosi sitten");
    expect(relativeTimePast(2, "years")).toEqual("noin 2 vuotta sitten");

    expect(relativeTimeFuture(1, "second")).toEqual("alle minuutin kuluttua");
    expect(relativeTimeFuture(2, "seconds")).toEqual("alle minuutin kuluttua");

    expect(relativeTimeFuture(1, "minute")).toEqual("minuutin kuluttua");
    expect(relativeTimeFuture(2, "minutes")).toEqual("2 minuutin kuluttua");

    expect(relativeTimeFuture(1, "hour")).toEqual("noin tunnin kuluttua");
    expect(relativeTimeFuture(2, "hours")).toEqual("noin 2 tunnin kuluttua");

    expect(relativeTimeFuture(1, "day")).toEqual("päivän kuluttua");
    expect(relativeTimeFuture(2, "days")).toEqual("2 päivän kuluttua");

    expect(relativeTimeFuture(1, "month")).toEqual("noin kuukauden kuluttua");
    expect(relativeTimeFuture(2, "months")).toEqual("2 kuukauden kuluttua");

    expect(relativeTimeFuture(1, "year")).toEqual("noin vuoden kuluttua");
    expect(relativeTimeFuture(2, "years")).toEqual("noin 2 vuoden kuluttua");
  });
});
