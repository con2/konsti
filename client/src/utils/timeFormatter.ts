import dayjs from "dayjs";
import { TIMEZONE } from "shared/utils/initializeDayjs";

// dayjs.format() is only called here to make sure all client times use correct timezone

export const getWeekdayAndTime = (time: string): string => {
  const timeFormat = "dddd HH:mm";
  // eslint-disable-next-line no-restricted-syntax -- We want to call format here
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const getDate = (time: string): string => {
  const timeFormat = "D.M.YYYY";
  // eslint-disable-next-line no-restricted-syntax -- We want to call format here
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const getShortDate = (time: string): string => {
  const timeFormat = "ddd D.M.";
  // eslint-disable-next-line no-restricted-syntax -- We want to call format here
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const getTime = (time: string): string => {
  const timeFormat = "HH:mm";
  // eslint-disable-next-line no-restricted-syntax -- We want to call format here
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const getShortWeekdayAndTime = (time: string): string => {
  const timeFormat = "ddd HH:mm";
  // eslint-disable-next-line no-restricted-syntax -- We want to call format here
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const timezoneFormat = "z";

export const getTimezone = (time: string): string => {
  const timeFormat = timezoneFormat;
  // eslint-disable-next-line no-restricted-syntax -- We want to call format here
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const dateAndTimeFormat = "ddd D.M.YYYY HH:mm";

export const getDateAndTime = (time: string): string => {
  const timeFormat = dateAndTimeFormat;
  // eslint-disable-next-line no-restricted-syntax -- We want to call format here
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
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
  // eslint-disable-next-line no-restricted-syntax -- We want to call format here
  return dayjs(currentTime).tz(TIMEZONE).format(timeFormat);
};
