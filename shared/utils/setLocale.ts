import { Locale as DateFnsLocale, Day, LocalizeFnOptions } from "date-fns";
// Imported one locale at a time: "date-fns/locale" is a barrel re-exporting all
// 724 locale modules, and the server runs unbundled under tsx, so importing it
// costs about a second and a few hundred MB of RSS on every boot and test worker
import { enUS } from "date-fns/locale/en-US";
import { fi } from "date-fns/locale/fi";
import { Locale } from "shared/types/locale";

// date-fns's abbreviated Finnish weekdays are "torst." / "kesk.", where the UI
// has always shown the two-letter forms - which is date-fns's "short" width, so
// this remaps rather than hard-coding the names. English needs the abbreviated
// width as it is ("Thu"), so it cannot be solved by picking a different token.
//
// This makes the abbreviated width unreachable in Finnish, deliberately: every
// formatter then gets the two-letter form from the ordinary token, where picking
// the width per call site would let a new formatter render "torst." by writing
// the token every other formatter already uses
const finnish: DateFnsLocale = {
  ...fi,
  localize: {
    ...fi.localize,
    day: (value: Day, options?: LocalizeFnOptions): string =>
      options?.width === "abbreviated"
        ? fi.localize.day(value, { ...options, width: "short" })
        : fi.localize.day(value, options),
  },
};

export const localeFor = (locale: Locale): DateFnsLocale =>
  locale === Locale.FI ? finnish : enUS;

// date-fns takes the locale per call rather than from global state, but the
// formatters are called from all over the app and only the language selector
// knows which one is active, so the choice is held here instead of threaded
// through every call site
let currentLocale: DateFnsLocale = enUS;
let currentLocaleCode: Locale = Locale.EN;
const listeners = new Set<() => void>();

export const setLocale = (locale: Locale): void => {
  if (locale === currentLocaleCode) {
    return;
  }
  currentLocale = localeFor(locale);
  currentLocaleCode = locale;
  for (const listener of listeners) {
    listener();
  }
};

export const getCurrentLocale = (): DateFnsLocale => currentLocale;

// The subscribe half of a store, so a UI reading the formatters can re-render
// when the language changes. Everything they produce depends on this module
// state, which is invisible to a rendering framework unless it is published
export const subscribeToLocale = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Must keep returning the same value until the language changes
export const getLocaleSnapshot = (): Locale => currentLocaleCode;
