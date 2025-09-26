// 国际化模块统一导出
// 简化其他文件的导入路径

export * from './translations';
export * from './LanguageContext';

// 便捷的重新导出
export { LanguageProvider, useTranslation, useT, useLanguage } from './LanguageContext';
export { translations, DEFAULT_LANGUAGE, getTranslation } from './translations';
export type { Language, Translations } from './translations';