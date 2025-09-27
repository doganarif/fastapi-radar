// i18n context and hooks
// Simple React Context pattern to avoid unnecessary complexity

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

// Context interface definition
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translations: Translations;
}

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Provider props
interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

// Local storage key
const LANGUAGE_STORAGE_KEY = "fastapi-radar-language";

// Read language from local storage
function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "zh") {
      return stored;
    }
  } catch (error) {
    // Ignore localStorage errors; fall back to default language
    console.warn("Failed to read language from localStorage:", error);
  }
  return DEFAULT_LANGUAGE;
}

// Persist language to local storage
function setStoredLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    // Ignore localStorage errors
    console.warn("Failed to save language to localStorage:", error);
  }
}

// Detect browser language
function detectBrowserLanguage(): Language {
  try {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("zh")) {
      return "zh";
    }
  } catch (error) {
    // Ignore detection errors
  }
  return DEFAULT_LANGUAGE;
}

// Provider implementation
export function LanguageProvider({
  children,
  defaultLanguage,
}: LanguageProviderProps) {
  // Initialize language: stored > prop default > browser > fallback
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = getStoredLanguage();
    if (stored) {
      return stored;
    }
    return defaultLanguage || detectBrowserLanguage();
  });

  // Get translation set for current language
  const translations = getTranslation(language);

  // Translate function – supports nested keys like "nav.dashboard"
  const t = (key: string): string => {
    return getNestedTranslation(translations, key);
  };

  // Set language helper
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setStoredLanguage(newLanguage);
  };

  // Update HTML lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Context value
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

// Hook: use translation utilities
export function useTranslation() {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }

  return context;
}

// Hook: get only the translate function (perf-friendly)
export function useT() {
  const { t } = useTranslation();
  return t;
}

// Hook: get current language
export function useLanguage() {
  const { language, setLanguage } = useTranslation();
  return { language, setLanguage };
}

// Export types for other files
export type { Language, LanguageContextType };
