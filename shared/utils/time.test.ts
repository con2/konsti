import { add } from "date-fns";
import { expect, test } from "vitest";
import { formatRelativeTime } from "shared/utils/relativeTime";
import { setLocale } from "shared/utils/setLocale";

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
  setLocale("en");

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
  setLocale("fi");

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
