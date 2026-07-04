import { JSDOM } from "jsdom";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { beforeEach } from "vitest";
import { getIconLibrary } from "client/utils/icons";
import { initializeDayjs } from "shared/utils/initializeDayjs";

// Node 25+ has a built-in localStorage that shadows the jsdom one we want to use,
// so explicitly use the jsdom one.
const storageWindow = new JSDOM("", {
  url: "https://example.com",
}).window;

Object.defineProperties(globalThis, {
  localStorage: {
    value: storageWindow.localStorage,
    configurable: true,
  },
  sessionStorage: {
    value: storageWindow.sessionStorage,
    configurable: true,
  },
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Icons
getIconLibrary();

// Translations
// eslint-disable-next-line @typescript-eslint/no-floating-promises
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
