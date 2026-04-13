import React, { useState } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const languages = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-coffee/10 dark:border-white/10 rounded-full text-coffee dark:text-creme transition-all shadow-sm hover:bg-white dark:hover:bg-white/20"
      >
        <Globe className="w-4 h-4 opacity-60" />
        <span className="text-xs font-medium">{currentLang.flag}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-40 bg-white dark:bg-ink border border-coffee/10 dark:border-white/10 rounded-2xl shadow-xl z-40 overflow-hidden"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as any);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-xs transition-colors ${
                    language === lang.code 
                      ? 'bg-coffee/5 dark:bg-white/5 text-coffee dark:text-sakura font-bold' 
                      : 'text-coffee/60 dark:text-creme/60 hover:bg-coffee/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
