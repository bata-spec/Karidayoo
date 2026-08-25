import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ja from './locales/ja.json';
import en from './locales/en.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';
import zhTW from './locales/zh-TW.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';
import hi from './locales/hi.json';
import id from './locales/id.json';
import ru from './locales/ru.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import vi from './locales/vi.json';
import th from './locales/th.json';

export const supportedLanguages = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'es', label: 'Español' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'th', label: 'ไทย' },
] as const;

export const rtlLanguages = new Set(['ar']);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
      ko: { translation: ko },
      zh: { translation: zh },
      'zh-TW': { translation: zhTW },
      es: { translation: es },
      'pt-BR': { translation: ptBR },
      hi: { translation: hi },
      id: { translation: id },
      ru: { translation: ru },
      ar: { translation: ar },
      fr: { translation: fr },
      de: { translation: de },
      vi: { translation: vi },
      th: { translation: th },
    },
    fallbackLng: 'ja',
    supportedLngs: supportedLanguages.map((l) => l.code),
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'karidayoo-language',
      caches: ['localStorage'],
    },
  });

export default i18n;
