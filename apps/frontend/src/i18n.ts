import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import es from './locales/es/common.json';
import en from './locales/en/common.json';
import { LOCALE_STORAGE_KEY, supportedLocales } from './i18n/persistedLocale';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    supportedLngs: supportedLocales as unknown as string[],
    nonExplicitSupportedLngs: true,
    cleanCode: true,
    fallbackLng: 'es',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
