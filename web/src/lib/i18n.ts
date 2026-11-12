import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import id from './locales/id.json';
import vi from './locales/vi.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            id: { translation: id },
            vi: { translation: vi },
        },
        lng: 'en',
        fallbackLng: 'en',
        supportedLngs: ['en', 'id', 'vi'],
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage'],
            caches: ['localStorage'],
        },
    });

export default i18n;
