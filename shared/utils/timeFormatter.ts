import dayjs, { Dayjs } from "dayjs";
import { TIMEZONE } from "shared/utils/initializeDayjs";

// dayjs.format() is only called here to make sure all client times use correct timezone

// Machine-readable date of an instant the caller has already put in the event
// timezone, for rebuilding an instant at a given wall-clock time on that day.
// The only formatter that must not re-apply .tz(): re-resolving the offset would
// move the date to the previous one across a DST change
export const getIsoDate = (time: Dayjs): string => time.format("YYYY-MM-DD");

export const getWeekdayAndTime = (time: string): string => {
  const timeFormat = "dddd HH:mm";
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const getDate = (time: string): string => {
  const timeFormat = "D.M.YYYY";
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const getShortDate = (time: string): string => {
  const timeFormat = "ddd D.M.";
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const getTime = (time: string): string => {
  const timeFormat = "HH:mm";
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const getShortWeekdayAndTime = (time: string): string => {
  const timeFormat = "ddd HH:mm";
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const timezoneFormat = "z";

export const getTimezone = (time: string): string => {
  const timeFormat = timezoneFormat;
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const dateAndTimeFormat = "ddd D.M.YYYY HH:mm";

export const getDateAndTime = (time: string): string => {
  const timeFormat = dateAndTimeFormat;
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const getDateAndTimeWithLocale = (
  time: string,
  locale: "fi" | "en",
): string => {
  const timeFormat = dateAndTimeFormat;
  return dayjs(time).tz(TIMEZONE).locale(locale).format(timeFormat);
};

export const formatProgramItemDuration = (mins: number): string => {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;

  const hoursStr = hours === 0 ? "" : `${hours} h`;
  const minutesStr = minutes === 0 ? "" : `${minutes} min`;

  return `${hoursStr} ${minutesStr}`;
};

export const formattedCurrentTime = (currentTime: Date): string => {
  const timeFormat = "HH:mm:ss";
  return dayjs(currentTime).tz(TIMEZONE).format(timeFormat);
};
