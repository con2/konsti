import moment from "moment";
import { WeekdayAndTime } from "client/utils/utils.typings";
import { capitalizeFirstLetter } from "client/utils/capitalizeFirstLetter";
import { sharedConfig } from "shared/config/sharedConfig";

const {
  SIGNUP_OPEN_TIME,
  SIGNUP_END_TIME,
  DAY_START_TIME,
  CONVENTION_START_TIME,
} = sharedConfig;

const getStartTime = (startTime: string): string => {
  const timeFormat = "HH:mm";

  // Signup starts before convention
  if (
    moment(startTime)
      .subtract(SIGNUP_OPEN_TIME, "hours")
      .isBefore(moment(CONVENTION_START_TIME))
  ) {
    return moment(CONVENTION_START_TIME).format(timeFormat);
  }
  // Signup starts before earliest signup time for a day
  else if (
    moment(startTime)
      .subtract(SIGNUP_OPEN_TIME, "hours")
      .isBefore(moment(startTime).hours(DAY_START_TIME))
  ) {
    return moment(startTime).hours(DAY_START_TIME).format(timeFormat);
  }
  // Valid signup start time
  else {
    return moment(startTime)
      .subtract(SIGNUP_OPEN_TIME, "hours")
      .format(timeFormat);
  }
};

const getEndTime = (startTime: string): string => {
  const timeFormat = "HH:mm";
  return moment(startTime)
    .subtract(SIGNUP_END_TIME, "minutes")
    .format(timeFormat);
};

const getWeekdayAndTime = ({ time, capitalize }: WeekdayAndTime): string => {
  const timeFormat = "dddd HH:mm";
  const formattedTime = moment(time).format(timeFormat);
  if (capitalize) return capitalizeFirstLetter(formattedTime);
  else return formattedTime;
};

const getDateAndTime = (time: string): string => {
  const timeFormat = "DD.M.YYYY HH:mm";
  return moment(time).format(timeFormat);
};

const getTime = (time: string): string => {
  const timeFormat = "HH:mm";
  return moment(time).format(timeFormat);
};

export const timeFormatter = {
  getStartTime,
  getEndTime,
  getWeekdayAndTime,
  getDateAndTime,
  getTime,
};
