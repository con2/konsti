import dayjs from "dayjs";
import "dayjs/locale/fi";

export const setLocale = (locale: string): void => {
  dayjs.locale(locale);
};
