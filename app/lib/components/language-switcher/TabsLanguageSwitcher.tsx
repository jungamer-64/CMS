/**
 * Tabs Language Switcher Component
 * タブ形式の言語切り替えコンポーネント
 */

'use client';

import React from 'react';
import type { LanguageSwitcherCommonProps } from './types';

interface TabsLanguageSwitcherProps extends LanguageSwitcherCommonProps {
  readonly className?: string;
}

export function TabsLanguageSwitcher({
  locale,
  availableLocales,
  className = '',
  showProgress,
  showNativeNames,
  getFlagEmoji,
  getProgress,
  getLocaleInfo,
  getTextDirection,
  handleLocaleChange,
  handleMouseEnter
}: TabsLanguageSwitcherProps) {
  return (
    <div className={`flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 ${className}`} dir={getTextDirection()}>
      {availableLocales.map((localeCode) => {
        const localeInfo = getLocaleInfo(localeCode);
        const isActive = localeCode === locale;
        const progress = getProgress(localeCode);
        
        return (
          <button
            key={localeCode}
            onClick={() => handleLocaleChange(localeCode)}
            onMouseEnter={() => handleMouseEnter(localeCode)}
            className={`relative flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
              isActive
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
            dir={localeInfo.isRTL ? 'rtl' : 'ltr'}
          >
            <span className="mr-2">{getFlagEmoji(localeCode)}</span>
            <span>{showNativeNames ? localeInfo.nativeName : localeInfo.name}</span>
            {showProgress && progress !== null && (
              <div 
                className="absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
