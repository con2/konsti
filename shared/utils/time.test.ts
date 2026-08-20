import { add } from "date-fns";
import { expect, test } from "vitest";
import { formatRelativeTime } from "shared/utils/relativeTime";
import { setLocale } from "shared/utils/setLocale";

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

  expect(relativeTimePast(1, "second")).toEqual("a few seconds ago");
  expect(relativeTimePast(2, "seconds")).toEqual("a few seconds ago");

  expect(relativeTimePast(1, "minute")).toEqual("a minute ago");
  expect(relativeTimePast(2, "minutes")).toEqual("2 minutes ago");

  expect(relativeTimePast(1, "hour")).toEqual("an hour ago");
  expect(relativeTimePast(2, "hours")).toEqual("2 hours ago");

  expect(relativeTimePast(1, "day")).toEqual("a day ago");
  expect(relativeTimePast(2, "days")).toEqual("2 days ago");

  expect(relativeTimePast(1, "month")).toEqual("a month ago");
  expect(relativeTimePast(2, "months")).toEqual("2 months ago");

  expect(relativeTimePast(1, "year")).toEqual("a year ago");
  expect(relativeTimePast(2, "years")).toEqual("2 years ago");

  expect(relativeTimeFuture(1, "second")).toEqual("in a few seconds");
  expect(relativeTimeFuture(2, "seconds")).toEqual("in a few seconds");

  expect(relativeTimeFuture(1, "minute")).toEqual("in a minute");
  expect(relativeTimeFuture(2, "minutes")).toEqual("in 2 minutes");

  expect(relativeTimeFuture(1, "hour")).toEqual("in an hour");
  expect(relativeTimeFuture(2, "hours")).toEqual("in 2 hours");

  expect(relativeTimeFuture(1, "day")).toEqual("in a day");
  expect(relativeTimeFuture(2, "days")).toEqual("in 2 days");

  expect(relativeTimeFuture(1, "month")).toEqual("in a month");
  expect(relativeTimeFuture(2, "months")).toEqual("in 2 months");

  expect(relativeTimeFuture(1, "year")).toEqual("in a year");
  expect(relativeTimeFuture(2, "years")).toEqual("in 2 years");
});

test("Format FI relative times correctly", () => {
  setLocale("fi");

  expect(relativeTimePast(1, "second")).toEqual("muutama sekunti sitten");
  expect(relativeTimePast(2, "seconds")).toEqual("muutama sekunti sitten");

  expect(relativeTimePast(1, "minute")).toEqual("minuutti sitten");
  expect(relativeTimePast(2, "minutes")).toEqual("2 minuuttia sitten");

  expect(relativeTimePast(1, "hour")).toEqual("tunti sitten");
  expect(relativeTimePast(2, "hours")).toEqual("2 tuntia sitten");

  expect(relativeTimePast(1, "day")).toEqual("päivä sitten");
  expect(relativeTimePast(2, "days")).toEqual("2 päivää sitten");

  expect(relativeTimePast(1, "month")).toEqual("kuukausi sitten");
  expect(relativeTimePast(2, "months")).toEqual("2 kuukautta sitten");

  expect(relativeTimePast(1, "year")).toEqual("vuosi sitten");
  expect(relativeTimePast(2, "years")).toEqual("2 vuotta sitten");

  expect(relativeTimeFuture(1, "second")).toEqual("muutaman sekunnin päästä");
  expect(relativeTimeFuture(2, "seconds")).toEqual("muutaman sekunnin päästä");

  expect(relativeTimeFuture(1, "minute")).toEqual("minuutin päästä");
  expect(relativeTimeFuture(2, "minutes")).toEqual("2 minuutin päästä");

  expect(relativeTimeFuture(1, "hour")).toEqual("tunnin päästä");
  expect(relativeTimeFuture(2, "hours")).toEqual("2 tunnin päästä");

  expect(relativeTimeFuture(1, "day")).toEqual("päivän päästä");
  expect(relativeTimeFuture(2, "days")).toEqual("2 päivän päästä");

  expect(relativeTimeFuture(1, "month")).toEqual("kuukauden päästä");
  expect(relativeTimeFuture(2, "months")).toEqual("2 kuukauden päästä");

  expect(relativeTimeFuture(1, "year")).toEqual("vuoden päästä");
  expect(relativeTimeFuture(2, "years")).toEqual("2 vuoden päästä");
});
