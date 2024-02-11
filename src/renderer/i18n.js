import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enMessages from './locales/en/translation.json';
import nlMessages from './locales/nl/translation.json';
import frMessages from './locales/fr/translation.json';
import ruMessages from './locales/ru/translation.json';
import deMessages from './locales/de/translation.json';
import esMessages from './locales/es/translation.json';
import itMessages from './locales/it/translation.json';
import brMessages from './locales/br/translation.json';

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: enMessages,
      },
      nl: {
        translation: nlMessages,
      },
      fr: {
        translation: frMessages,
      },
      ru: {
        translation: ruMessages,
      },
      de: {
        translation: deMessages,
      },
      es: {
        translation: esMessages,
      },
      it: {
        translation: itMessages,
      },
      br: {
        translation: brMessages,
      },
    },
  });

export default i18n;
