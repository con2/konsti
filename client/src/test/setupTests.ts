import "regenerator-runtime/runtime";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { getIconLibrary } from "client/utils/icons";
import { initializeDayjs } from "shared/utils/time";

// Icons
getIconLibrary();

// Translations
i18next.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  debug: false,
  resources: {
    en: {},
  },
  interpolation: {
    escapeValue: false,
  },
});

initializeDayjs();
