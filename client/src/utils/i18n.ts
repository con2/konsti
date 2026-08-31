import i18next from "i18next";
import languageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { Locale } from "shared/types/locale";
import { translationEN } from "client/locales/en";
import { translationFI } from "client/locales/fi";

export const defaultNS = "ns1";

const fallbackLanguage = Locale.EN;

export const resources = {
  en: {
    ns1: translationEN,
  },
  fi: {
    ns1: translationFI,
  },
};

// The document declares a language in its markup, which is only right for
// whichever language happens to render first. A browser that finds the content
// in a different language than the one declared offers to translate the page,
// and the translation replaces React's text nodes, so the next commit throws on
// nodes that have moved. Registered before init so the language i18next
// resolves during startup is applied too.
i18next.on("languageChanged", () => {
  document.documentElement.lang = i18next.resolvedLanguage ?? fallbackLanguage;
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
i18next
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: fallbackLanguage, // use if detected lng is not available
    interpolation: {
      escapeValue: false, // react escapes by default -> safe from xss
    },
    // Without this a Finnish browser lands on the English UI, and users reach
    // for the browser's translate button instead of the language selector.
    // Browser translation rewrites the DOM under React, which breaks the next
    // commit outright, so the default language is what keeps the app standing.
    supportedLngs: [Locale.EN, Locale.FI],
    detection: {
      order: ["localStorage", "navigator"],
      // The rest of the app compares against the bare language codes and the
      // stored value is parsed strictly against them, so a region-tagged
      // "fi-FI" has to be narrowed before it is used or cached
      convertDetectedLanguage: (language) => language.split("-", 1)[0],
    },
    defaultNS,
    returnNull: false,
  });

// https://dev.to/pffigueiredo/typescript-utility-keyof-nested-object-2pa3
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type Equals<X, Y> = [X, Y] extends [Y, X] ? true : false;

/* eslint-disable @typescript-eslint/no-unused-vars */

// If following gives type error, EN and FI language files don't match
const expectLocalesToMatch: Equals<
  NestedKeyOf<typeof translationEN>,
  NestedKeyOf<typeof translationFI>
> = true;

/* eslint-enable @typescript-eslint/no-unused-vars */
