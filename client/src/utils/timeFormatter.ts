import dayjs from "dayjs";
import { capitalizeFirstLetter } from "client/utils/capitalizeFirstLetter";

interface WeekdayAndTime {
  time: string;
  capitalize?: boolean;
}

export const getWeekdayAndTime = ({
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

export const getDate = (time: string): string => {
  const timeFormat = "DD.M.YYYY";
  return dayjs(time).format(timeFormat);
};

export const getTime = (time: string): string => {
  const timeFormat = "HH:mm";
  return dayjs(time).format(timeFormat);
};
