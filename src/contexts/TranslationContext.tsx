import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '../translations/en.json';
import pt from '../translations/pt.json';
import es from '../translations/es.json';

type Language = 'en' | 'pt' | 'es';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, any> = { en, pt, es };

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('quillora_lang') as Language;
    if (saved && ['en', 'pt', 'es'].includes(saved)) return saved;
    
    const browserLang = navigator.language.split('-')[0];
    if (['en', 'pt', 'es'].includes(browserLang)) return browserLang as Language;
    
    return 'pt'; // Default
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('quillora_lang', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        // Fallback to English if key not found in current language
        let fallbackValue = translations['en'];
        for (const fk of keys) {
          if (fallbackValue && fallbackValue[fk]) {
            fallbackValue = fallbackValue[fk];
          } else {
            return key; // Return key if not found at all
          }
        }
        return fallbackValue;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
