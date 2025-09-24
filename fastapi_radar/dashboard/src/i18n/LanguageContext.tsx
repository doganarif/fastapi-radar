// 国际化Context和Hook实现
// 使用最简单的React Context模式，避免过度复杂化

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  Language,
  DEFAULT_LANGUAGE,
  getTranslation,
  getNestedTranslation,
  Translations,
} from "./translations";

// Context接口定义
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translations: Translations;
}

// 创建Context
const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Provider组件属性
interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

// 本地存储键名
const LANGUAGE_STORAGE_KEY = "fastapi-radar-language";

// 从本地存储获取语言设置
function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "zh") {
      return stored;
    }
  } catch (error) {
    // 忽略localStorage错误，使用默认语言
    console.warn("Failed to read language from localStorage:", error);
  }
  return DEFAULT_LANGUAGE;
}

// 保存语言设置到本地存储
function setStoredLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    // 忽略localStorage错误
    console.warn("Failed to save language to localStorage:", error);
  }
}

// 检测浏览器语言
function detectBrowserLanguage(): Language {
  try {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("zh")) {
      return "zh";
    }
  } catch (error) {
    // 忽略检测错误
  }
  return DEFAULT_LANGUAGE;
}

// Provider组件实现
export function LanguageProvider({
  children,
  defaultLanguage,
}: LanguageProviderProps) {
  // 初始化语言：优先级 -> 存储的语言 > 传入的默认语言 > 浏览器语言 > 系统默认
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = getStoredLanguage();
    if (stored) {
      return stored;
    }
    return defaultLanguage || detectBrowserLanguage();
  });

  // 获取当前语言的翻译对象
  const translations = getTranslation(language);

  // 翻译函数 - 支持嵌套键名如 "nav.dashboard"
  const t = (key: string): string => {
    return getNestedTranslation(translations, key);
  };

  // 设置语言函数
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setStoredLanguage(newLanguage);
  };

  // 监听语言变化，更新HTML lang属性
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Context值
  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t,
    translations,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook：使用翻译功能
export function useTranslation() {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }

  return context;
}

// Hook：仅获取翻译函数（性能优化版本）
export function useT() {
  const { t } = useTranslation();
  return t;
}

// Hook：获取当前语言
export function useLanguage() {
  const { language, setLanguage } = useTranslation();
  return { language, setLanguage };
}

// 导出类型供其他文件使用
export type { Language, LanguageContextType };
