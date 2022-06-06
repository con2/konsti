import i18next from "i18next";
import languageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import translationEN from "client/locales/en.json";
import translationFI from "client/locales/fi.json";

export const defaultNS = "ns1";

export const resources = {
  en: {
    ns1: translationEN,
  },
  fi: {
    ns1: translationFI,
  },
};

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
  });

type Equals<X, Y> = [X, Y] extends [Y, X] ? true : false;

/* eslint-disable @typescript-eslint/no-unused-vars */

// If following gives type error, EN and FI language files don't match
const expectLocalesToMatch: Equals<typeof translationEN, typeof translationFI> =
  true;

/* eslint-enable @typescript-eslint/no-unused-vars */
