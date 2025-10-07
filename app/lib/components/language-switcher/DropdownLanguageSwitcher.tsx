/**
 * Dropdown Language Switcher Component
 * ドロップダウン形式の言語切り替えコンポーネント
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { LanguageSwitcherCommonProps } from './types';

interface DropdownLanguageSwitcherProps extends LanguageSwitcherCommonProps {
  readonly className?: string;
  readonly isRTL: boolean;
}

export function DropdownLanguageSwitcher({
  locale,
  availableLocales,
  className = '',
  showProgress,
  showNativeNames,
  isRTL,
  getFlagEmoji,
  getProgress,
  getLocaleInfo,
  getTextDirection,
  handleLocaleChange,
  handleMouseEnter
}: DropdownLanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // クリック外での閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLocaleInfo = getLocaleInfo(locale);
  
  const handleLocaleClick = async (newLocale: typeof locale) => {
    await handleLocaleChange(newLocale);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef} dir={getTextDirection()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        dir={currentLocaleInfo.isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center">
          <span className={`text-lg ${isRTL ? 'ml-2' : 'mr-2'}`}>{getFlagEmoji(locale)}</span>
          <span>{showNativeNames ? currentLocaleInfo.nativeName : currentLocaleInfo.name}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 mt-1 w-60 min-w-60 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            {availableLocales.map((localeCode) => {
              const localeInfo = getLocaleInfo(localeCode);
              const isActive = localeCode === locale;
              const progress = getProgress(localeCode);
              
              return (
                <div key={localeCode}>
                  <button
                    onClick={() => handleLocaleClick(localeCode)}
                    onMouseEnter={() => handleMouseEnter(localeCode)}
                    className={`relative w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors ${
                      isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
                    }`}
                    dir={localeInfo.isRTL ? 'rtl' : 'ltr'}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center min-w-0 flex-1">
                        <span className={`text-lg flex-shrink-0 ${localeInfo.isRTL ? 'ml-3' : 'mr-3'}`}>
                          {getFlagEmoji(localeCode)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">
                            {showNativeNames ? localeInfo.nativeName : localeInfo.name}
                          </div>
                          {showNativeNames && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {localeInfo.name}
                            </div>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {showProgress && progress !== null && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Translation Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
