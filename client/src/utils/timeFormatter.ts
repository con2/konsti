import moment from 'moment';
import { config } from 'config';
import { WeekdayAndTime } from 'typings/utils.typings';

const {
  SIGNUP_OPEN_TIME,
  SIGNUP_END_TIME,
  CONVENTION_START_TIME,
  DAY_START_TIME,
} = config;

const startTime = (startTime: string): string => {
  const timeFormat = 'HH:mm';

  // Signup starts before convention
  if (
    moment(startTime)
      .subtract(SIGNUP_OPEN_TIME, 'hours')
      .isBefore(moment(CONVENTION_START_TIME))
  ) {
    return moment(CONVENTION_START_TIME).format(timeFormat);
  }
  // Signup starts before earliest signup time for a day
  else if (
    moment(startTime)
      .subtract(SIGNUP_OPEN_TIME, 'hours')
      .isBefore(moment(startTime).hours(DAY_START_TIME))
  ) {
    return moment(startTime).hours(DAY_START_TIME).format(timeFormat);
  }
  // Valid signup start time
  else {
    return moment(startTime)
      .subtract(SIGNUP_OPEN_TIME, 'hours')
      .format(timeFormat);
  }
};

const endTime = (startTime: string): string => {
  const timeFormat = 'HH:mm';
  return moment(startTime)
    .subtract(SIGNUP_END_TIME, 'minutes')
    .format(timeFormat);
};

const weekdayAndTime = ({ time, capitalize }: WeekdayAndTime): string => {
  const timeFormat = 'dddd HH:mm';
  const formattedTime = moment(time).format(timeFormat);
  if (capitalize) return capitalizeFirstLetter(formattedTime);
  else return formattedTime;
};

const dateAndTime = (time: string): string => {
  const timeFormat = 'DD.M.YYYY HH:mm';
  return moment(time).format(timeFormat);
};

const time = (time: string): string => {
  const timeFormat = 'HH:mm';
  return moment(time).format(timeFormat);
};

const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const timeFormatter = {
  startTime,
  endTime,
  weekdayAndTime,
  dateAndTime,
  time,
};
