
import { useContext } from 'react';
import { translations, TranslationKey, Language } from '../i18n';
import { LanguageContext, LanguageContextType } from '../contexts/LanguageContext';

export const useTranslations = () => {
  const { language } = useContext(LanguageContext) as LanguageContextType;

  const t = (key: TranslationKey, replacements?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations['en'][key]; // Fallback to English
    
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
      });
    }
    return translation;
  };

  return { t, currentLanguage: language };
};