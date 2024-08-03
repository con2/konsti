import i18next from "i18next";
import languageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { translationEN } from "client/locales/en";
import { translationFI } from "client/locales/fi";

export const defaultNS = "ns1";

export const resources = {
  en: {
    ns1: translationEN,
  },
  fi: {
    ns1: translationFI,
  },
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
i18next
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en", // use if detected lng is not available
    interpolation: {
      escapeValue: false, // react escapes by default -> safe from xss
    },
    detection: {
      order: ["localStorage"],
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
