// i18n module re-exports
// Simplify import paths for other files

export * from './translations';
export * from './LanguageContext';

// Convenience re-exports
export { LanguageProvider, useTranslation, useT, useLanguage } from './LanguageContext';
export { translations, DEFAULT_LANGUAGE, getTranslation } from './translations';
export type { Language, Translations } from './translations';
