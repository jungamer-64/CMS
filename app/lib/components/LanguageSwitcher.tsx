/**
 * 言語切り替えコンポーネント
 * Language Switcher Component
 */

'use client';

import React from 'react';
import { useI18n, type Locale } from '../contexts/i18n-context';

interface LanguageSwitcherProps {
  readonly className?: string;
  readonly showLabel?: boolean;
}

export default function LanguageSwitcher({ 
  className = '', 
  showLabel = false 
}: LanguageSwitcherProps) {
  const { locale, setLocale, availableLocales, t } = useI18n();

  const languageNames: Record<Locale, string> = {
    ja: '日本語',
    en: 'English',
  };

  const languageFlags: Record<Locale, string> = {
    ja: '🇯🇵',
    en: '🇺🇸',
  };

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value as Locale)}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
        aria-label={t('navigation.languageSelect') || 'Select Language'}
      >
        {availableLocales.map((lang) => (
          <option key={lang} value={lang}>
            {languageFlags[lang]} {languageNames[lang]}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg 
          className="w-4 h-4 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </div>
      
      {showLabel && (
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          {t('navigation.language') || 'Language'}
        </span>
      )}
    </div>
  );
}

// Button style language switcher
export function LanguageToggle({ className = '' }: { readonly className?: string }) {
  const { locale, setLocale } = useI18n();

  const toggleLanguage = () => {
    setLocale(locale === 'ja' ? 'en' : 'ja');
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
      aria-label={`Switch to ${locale === 'ja' ? 'English' : 'Japanese'}`}
    >
      <span className="text-lg">
        {locale === 'ja' ? '🇺🇸' : '🇯🇵'}
      </span>
    </button>
  );
}
