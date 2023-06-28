import dayjs, { Dayjs } from "dayjs";
import { capitalizeFirstLetter } from "client/utils/capitalizeFirstLetter";
import { sharedConfig } from "shared/config/sharedConfig";

const { PRE_SIGNUP_START, DIRECT_SIGNUP_START } = sharedConfig;

const getStartTime = (startTime: string): Dayjs => {
  const unmodifiedStartTime = dayjs(startTime).subtract(
    PRE_SIGNUP_START,
    "minutes"
  );

  const startTimeIsTooEarly = unmodifiedStartTime.hour() < 7;

  if (startTimeIsTooEarly) {
    return unmodifiedStartTime.subtract(1, "day").hour(22);
  }
  return unmodifiedStartTime;
};

const getEndTime = (startTime: string): Dayjs => {
  return dayjs(startTime).subtract(DIRECT_SIGNUP_START, "minutes");
};

interface WeekdayAndTime {
  time: string;
  capitalize?: boolean;
}

const getWeekdayAndTime = ({
  time,
  capitalize = false,
}: WeekdayAndTime): string => {
  const timeFormat = "dddd HH:mm";
  const formattedTime = dayjs(time).format(timeFormat);
  if (capitalize) {
    return capitalizeFirstLetter(formattedTime);
  }
  return formattedTime;
};

const getDateAndTime = (time: string): string => {
  const timeFormat = "DD.M.YYYY HH:mm";
  return dayjs(time).format(timeFormat);
};

const getDate = (time: string): string => {
  const timeFormat = "DD.M.YYYY";
  return dayjs(time).format(timeFormat);
};

const getTime = (time: string): string => {
  const timeFormat = "HH:mm";
  return dayjs(time).format(timeFormat);
};

export const timeFormatter = {
  getStartTime,
  getEndTime,
  getWeekdayAndTime,
  getDateAndTime,
  getDate,
  getTime,
};
