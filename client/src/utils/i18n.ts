import i18next from "i18next";
import languageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import translationEN from "client/locales/en.json";
import translationFI from "client/locales/fi.json";

const resources = {
  en: {
    translation: translationEN,
  },
  fi: {
    translation: translationFI,
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
  });
