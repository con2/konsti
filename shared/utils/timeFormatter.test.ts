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

// The same instants in both languages, so a locale update rewording a weekday shows up here
describe.each([
  {
    locale: Locale.EN,
    getWeekdayAndTime: [
      [WINTER, "Thursday 12:30"],
      [SUMMER, "Wednesday 13:30"],
      [MARCH_DST_BEFORE, "Sunday 02:59"],
      [MARCH_DST_AFTER, "Sunday 04:00"],
      [OCTOBER_DST_BEFORE, "Sunday 03:59"],
      [OCTOBER_DST_AFTER, "Sunday 03:00"],
      [MIDNIGHT, "Wednesday 00:00"],
    ],
    getShortDate: [
      [WINTER, "Thu 15.1."],
      [SUMMER, "Wed 15.7."],
      [MARCH_DST_AFTER, "Sun 29.3."],
      [MIDNIGHT, "Wed 11.2."],
    ],
    getShortWeekdayAndTime: [
      [WINTER, "Thu 12:30"],
      [SUMMER, "Wed 13:30"],
      [OCTOBER_DST_AFTER, "Sun 03:00"],
      [MIDNIGHT, "Wed 00:00"],
    ],
    getDateAndTime: [
      [WINTER, "Thu 15.1.2026 12:30"],
      [SUMMER, "Wed 15.7.2026 13:30"],
      [OCTOBER_DST_AFTER, "Sun 25.10.2026 03:00"],
      [YEAR_END, "Thu 31.12.2026 23:59"],
    ],
  },
  {
    locale: Locale.FI,
    getWeekdayAndTime: [
      [WINTER, "torstai 12:30"],
      [SUMMER, "keskiviikko 13:30"],
      [MARCH_DST_BEFORE, "sunnuntai 02:59"],
      [MARCH_DST_AFTER, "sunnuntai 04:00"],
      [OCTOBER_DST_BEFORE, "sunnuntai 03:59"],
      [OCTOBER_DST_AFTER, "sunnuntai 03:00"],
      [MIDNIGHT, "keskiviikko 00:00"],
    ],
    getShortDate: [
      [WINTER, "to 15.1."],
      [SUMMER, "ke 15.7."],
      [MARCH_DST_AFTER, "su 29.3."],
      [MIDNIGHT, "ke 11.2."],
    ],
    getShortWeekdayAndTime: [
      [WINTER, "to 12:30"],
      [SUMMER, "ke 13:30"],
      [OCTOBER_DST_AFTER, "su 03:00"],
      [MIDNIGHT, "ke 00:00"],
    ],
    getDateAndTime: [
      [WINTER, "to 15.1.2026 12:30"],
      [SUMMER, "ke 15.7.2026 13:30"],
      [OCTOBER_DST_AFTER, "su 25.10.2026 03:00"],
      [YEAR_END, "to 31.12.2026 23:59"],
    ],
  },
])("$locale locale formatting", ({ locale, ...expectations }) => {
  beforeAll(() => {
    setLocale(locale);
  });

  test.each(expectations.getWeekdayAndTime)(
    "getWeekdayAndTime(%s) is %s",
    (time, expected) => {
      expect(getWeekdayAndTime(time)).toEqual(expected);
    },
  );

  test.each(expectations.getShortDate)(
    "getShortDate(%s) is %s",
    (time, expected) => {
      expect(getShortDate(time)).toEqual(expected);
    },
  );

  test.each(expectations.getShortWeekdayAndTime)(
    "getShortWeekdayAndTime(%s) is %s",
    (time, expected) => {
      expect(getShortWeekdayAndTime(time)).toEqual(expected);
    },
  );

  test.each(expectations.getDateAndTime)(
    "getDateAndTime(%s) is %s",
    (time, expected) => {
      expect(getDateAndTime(time)).toEqual(expected);
    },
  );
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

  interface RelativeTimeCases {
    locale: Locale;
    past: [number, Unit, string][];
    future: [number, Unit, string][];
  }

  const relativeTimeCases: RelativeTimeCases[] = [
    {
      locale: Locale.EN,
      past: [
        [1, "second", "less than a minute ago"],
        [2, "seconds", "less than a minute ago"],
        [1, "minute", "1 minute ago"],
        [2, "minutes", "2 minutes ago"],
        [1, "hour", "about 1 hour ago"],
        [2, "hours", "about 2 hours ago"],
        [1, "day", "1 day ago"],
        [2, "days", "2 days ago"],
        [1, "month", "about 1 month ago"],
        [2, "months", "2 months ago"],
        [1, "year", "about 1 year ago"],
        [2, "years", "about 2 years ago"],
      ],
      future: [
        [1, "second", "in less than a minute"],
        [2, "seconds", "in less than a minute"],
        [1, "minute", "in 1 minute"],
        [2, "minutes", "in 2 minutes"],
        [1, "hour", "in about 1 hour"],
        [2, "hours", "in about 2 hours"],
        [1, "day", "in 1 day"],
        [2, "days", "in 2 days"],
        [1, "month", "in about 1 month"],
        [2, "months", "in 2 months"],
        [1, "year", "in about 1 year"],
        [2, "years", "in about 2 years"],
      ],
    },
    {
      locale: Locale.FI,
      past: [
        [1, "second", "alle minuutti sitten"],
        [2, "seconds", "alle minuutti sitten"],
        [1, "minute", "minuutti sitten"],
        [2, "minutes", "2 minuuttia sitten"],
        [1, "hour", "noin tunti sitten"],
        [2, "hours", "noin 2 tuntia sitten"],
        [1, "day", "päivä sitten"],
        [2, "days", "2 päivää sitten"],
        [1, "month", "noin kuukausi sitten"],
        [2, "months", "2 kuukautta sitten"],
        [1, "year", "noin vuosi sitten"],
        [2, "years", "noin 2 vuotta sitten"],
      ],
      future: [
        [1, "second", "alle minuutin kuluttua"],
        [2, "seconds", "alle minuutin kuluttua"],
        [1, "minute", "minuutin kuluttua"],
        [2, "minutes", "2 minuutin kuluttua"],
        [1, "hour", "noin tunnin kuluttua"],
        [2, "hours", "noin 2 tunnin kuluttua"],
        [1, "day", "päivän kuluttua"],
        [2, "days", "2 päivän kuluttua"],
        [1, "month", "noin kuukauden kuluttua"],
        [2, "months", "2 kuukauden kuluttua"],
        [1, "year", "noin vuoden kuluttua"],
        [2, "years", "noin 2 vuoden kuluttua"],
      ],
    },
  ];

  describe.each(relativeTimeCases)("$locale", ({ locale, past, future }) => {
    beforeAll(() => {
      setLocale(locale);
    });

    test.each(past)("%s %s ago is '%s'", (number, unit, expected) => {
      expect(relativeTimePast(number, unit)).toEqual(expected);
    });

    test.each(future)("in %s %s is '%s'", (number, unit, expected) => {
      expect(relativeTimeFuture(number, unit)).toEqual(expected);
    });
  });
});
