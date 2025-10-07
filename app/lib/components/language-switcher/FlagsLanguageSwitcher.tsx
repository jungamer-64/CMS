/**
 * Flags Language Switcher Component
 * フラグ形式の言語切り替えコンポーネント
 */

'use client';

import React from 'react';
import type { LanguageSwitcherCommonProps } from './types';

interface FlagsLanguageSwitcherProps extends LanguageSwitcherCommonProps {
  readonly className?: string;
}

export function FlagsLanguageSwitcher({
  locale,
  availableLocales,
  className = '',
  showProgress,
  getFlagEmoji,
  getProgress,
  getLocaleInfo,
  getTextDirection,
  handleLocaleChange,
  handleMouseEnter
}: FlagsLanguageSwitcherProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`} dir={getTextDirection()}>
      {availableLocales.map((localeCode) => {
        const isActive = localeCode === locale;
        const progress = getProgress(localeCode);
        
        return (
          <button
            key={localeCode}
            onClick={() => handleLocaleChange(localeCode)}
            onMouseEnter={() => handleMouseEnter(localeCode)}
            className={`relative p-2 rounded-full transition-all hover:scale-110 ${
              isActive ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={getLocaleInfo(localeCode).nativeName}
          >
            <span className="text-2xl">{getFlagEmoji(localeCode)}</span>
            {showProgress && progress !== null && (
              <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
