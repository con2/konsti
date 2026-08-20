import { Day, Locale, LocalizeFnOptions } from "date-fns";
// Imported one locale at a time: "date-fns/locale" is a barrel re-exporting all
// 724 locale modules, and the server runs unbundled under tsx, so importing it
// costs about a second and a few hundred MB of RSS on every boot and test worker
import { enUS } from "date-fns/locale/en-US";
import { fi } from "date-fns/locale/fi";

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
