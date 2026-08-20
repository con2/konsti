import { Day, Locale, LocalizeFnOptions } from "date-fns";
import { enUS, fi } from "date-fns/locale";

// date-fns's abbreviated Finnish weekdays are "torst." / "kesk.", where the UI
// has always shown the two-letter forms. English needs the abbreviated width as
// it is ("Thu"), so this cannot be solved by picking a different format token
const FI_SHORT_WEEKDAYS = ["su", "ma", "ti", "ke", "to", "pe", "la"];

const finnish: Locale = {
  ...fi,
  localize: {
    ...fi.localize,
    day: (value: Day, options?: LocalizeFnOptions): string =>
      options?.width === "abbreviated"
        ? FI_SHORT_WEEKDAYS[value]
        : fi.localize.day(value, options),
  },
};

export const localeFor = (locale: string): Locale =>
  locale === "fi" ? finnish : enUS;

// date-fns takes the locale per call rather than from global state, but the
// formatters are called from all over the app and only the language selector
// knows which one is active, so the choice is held here instead of threaded
// through every call site
let currentLocale: Locale = enUS;

export const setLocale = (locale: string): void => {
  currentLocale = localeFor(locale);
};

export const getCurrentLocale = (): Locale => currentLocale;
