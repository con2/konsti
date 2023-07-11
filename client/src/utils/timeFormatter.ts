import dayjs from "dayjs";
import { TIMEZONE } from "shared/utils/initializeDayjs";

// dayjs.format() is only called here to make sure all client times use correct timezone

export const getWeekdayAndTime = (time: string): string => {
  const timeFormat = "dddd HH:mm";
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const getDate = (time: string): string => {
  const timeFormat = "DD.M.YYYY";
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};

export const getTime = (time: string): string => {
  const timeFormat = "HH:mm";
  return dayjs(time).tz(TIMEZONE).format(timeFormat);
};
