import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

i18next.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  debug: false,
  resources: {
    en: {},
  },
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
});
