import { addHours, addMinutes, subHours, subWeeks } from "date-fns";
import { config } from "shared/config";

const { eventStartTime, phaseGap, preConventionWeekSignupStartTime } =
  config.event();

export const testTimes = [
  // Before event
  subWeeks(new Date(eventStartTime), 3).toISOString(),
  subWeeks(new Date(eventStartTime), 2).toISOString(),
  ...(preConventionWeekSignupStartTime
    ? [new Date(preConventionWeekSignupStartTime).toISOString()]
    : []),
  subWeeks(new Date(eventStartTime), 1).toISOString(),
  // Friday
  subHours(new Date(eventStartTime), 5).toISOString(),
  subHours(new Date(eventStartTime), 1).toISOString(),
  addMinutes(subHours(new Date(eventStartTime), 1), phaseGap - 2).toISOString(),
  new Date(eventStartTime).toISOString(),
  addMinutes(new Date(eventStartTime), 45).toISOString(),
  addHours(new Date(eventStartTime), 1).toISOString(),
  addMinutes(addHours(new Date(eventStartTime), 1), 1).toISOString(),
  addMinutes(addHours(new Date(eventStartTime), 1), 5).toISOString(),
  addHours(new Date(eventStartTime), 2).toISOString(),
  addMinutes(addHours(new Date(eventStartTime), 2), phaseGap - 2).toISOString(),
  addMinutes(addHours(new Date(eventStartTime), 2), phaseGap + 2).toISOString(),
  addHours(new Date(eventStartTime), 3).toISOString(),
  addHours(new Date(eventStartTime), 5).toISOString(),
  addHours(new Date(eventStartTime), 6).toISOString(),
  addMinutes(addHours(new Date(eventStartTime), 6), 3).toISOString(),
  addHours(new Date(eventStartTime), 8).toISOString(),

  // Saturday
  addHours(new Date(eventStartTime), 10).toISOString(),
  addHours(new Date(eventStartTime), 15).toISOString(),
  addHours(new Date(eventStartTime), 16).toISOString(),
  addHours(new Date(eventStartTime), 18).toISOString(),
  addHours(new Date(eventStartTime), 24).toISOString(),
  addHours(new Date(eventStartTime), 28).toISOString(),
  addHours(new Date(eventStartTime), 32).toISOString(),

  // Sunday
  addHours(new Date(eventStartTime), 36).toISOString(),
  addHours(new Date(eventStartTime), 40).toISOString(),
  addHours(new Date(eventStartTime), 42).toISOString(),
  addHours(new Date(eventStartTime), 46).toISOString(),
  addHours(new Date(eventStartTime), 52).toISOString(),

  // Time now
  new Date().toISOString(),
];
