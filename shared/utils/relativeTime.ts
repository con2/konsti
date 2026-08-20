import { differenceInMonths, differenceInYears } from "date-fns";
import { getCurrentLocaleCode } from "shared/utils/setLocale";

// Written out rather than taken from date-fns's formatDistance because the two
// bucket differently - date-fns calls anything under 30s "less than a minute"
// where this reports "a few seconds" up to 45s - and the wording is user visible

type Unit =
  | "s"
  | "m"
  | "mm"
  | "h"
  | "hh"
  | "d"
  | "dd"
  | "M"
  | "MM"
  | "y"
  | "yy";

// Each step either measures in a new unit or reuses the previous measurement to
// decide whether the value has grown past a rounder way of saying it
const STEPS: { unit: Unit; limit?: number; measure?: keyof Amounts }[] = [
  { unit: "s", limit: 44, measure: "seconds" },
  { unit: "m", limit: 89 },
  { unit: "mm", limit: 44, measure: "minutes" },
  { unit: "h", limit: 89 },
  { unit: "hh", limit: 21, measure: "hours" },
  { unit: "d", limit: 35 },
  { unit: "dd", limit: 25, measure: "days" },
  { unit: "M", limit: 45 },
  { unit: "MM", limit: 10, measure: "months" },
  { unit: "y", limit: 17 },
  { unit: "yy", measure: "years" },
];

interface Amounts {
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  months: number;
  years: number;
}

const EN: Record<Unit, string> = {
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
};

// Finnish needs a different case depending on direction: "minuutti sitten" but
// "minuutin päästä", so each unit carries a past and a future form
const FI: Record<Unit, [string, string]> = {
  s: ["muutama sekunti", "muutaman sekunnin"],
  m: ["minuutti", "minuutin"],
  mm: ["%d minuuttia", "%d minuutin"],
  h: ["tunti", "tunnin"],
  hh: ["%d tuntia", "%d tunnin"],
  d: ["päivä", "päivän"],
  dd: ["%d päivää", "%d päivän"],
  M: ["kuukausi", "kuukauden"],
  MM: ["%d kuukautta", "%d kuukauden"],
  y: ["vuosi", "vuoden"],
  yy: ["%d vuotta", "%d vuoden"],
};

const measure = (from: Date, to: Date): Amounts => {
  const ms = Math.abs(to.getTime() - from.getTime());
  return {
    seconds: Math.round(ms / 1000),
    minutes: Math.round(ms / (60 * 1000)),
    hours: Math.round(ms / (60 * 60 * 1000)),
    days: Math.round(ms / (24 * 60 * 60 * 1000)),
    months: Math.abs(differenceInMonths(to, from)),
    years: Math.abs(differenceInYears(to, from)),
  };
};

const pickUnit = (amounts: Amounts): { unit: Unit; amount: number } => {
  let amount = amounts.seconds;

  for (const [index, step] of STEPS.entries()) {
    if (step.measure) {
      amount = amounts[step.measure];
    }
    if (step.limit === undefined || amount <= step.limit) {
      // One of something is better said with the rounder unit above it: a value
      // that rounds to a single minute reads as "a minute", not "1 minutes"
      const step_ = amount <= 1 && index > 0 ? STEPS[index - 1] : step;
      return { unit: step_.unit, amount };
    }
  }

  return { unit: "yy", amount: amounts.years };
};

// Describes `to` relative to `from`, e.g. "2 minutes ago" or "in an hour"
export const formatRelativeTime = (
  from: Date,
  to: Date,
  locale: string = getCurrentLocaleCode(),
): string => {
  const isFuture = to.getTime() > from.getTime();
  const { unit, amount } = pickUnit(measure(from, to));

  if (locale === "fi") {
    const value = FI[unit][isFuture ? 1 : 0].replace("%d", String(amount));
    return isFuture ? `${value} päästä` : `${value} sitten`;
  }

  const value = EN[unit].replace("%d", String(amount));
  return isFuture ? `in ${value}` : `${value} ago`;
};
