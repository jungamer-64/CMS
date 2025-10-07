/**
 * Carousel Language Switcher Component
 * カルーセル形式の言語切り替えコンポーネント
 */

'use client';

import React from 'react';
import type { LanguageSwitcherCommonProps } from './types';
import type { Locale } from '../../contexts/advanced-i18n-context';

interface CarouselLanguageSwitcherProps extends LanguageSwitcherCommonProps {
  readonly className?: string;
  readonly sortedLocales: Locale[];
}

export function CarouselLanguageSwitcher({
  locale,
  className = '',
  sortedLocales,
  showProgress,
  showNativeNames,
  getFlagEmoji,
  getProgress,
  getLocaleInfo,
  getTextDirection,
  handleLocaleChange
}: CarouselLanguageSwitcherProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`} dir={getTextDirection()}>
      <button 
        onClick={() => {
          const currentIndex = sortedLocales.indexOf(locale);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : sortedLocales.length - 1;
          handleLocaleChange(sortedLocales[prevIndex]);
        }}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Previous language"
      >
        ◀
      </button>
      
      <div className="flex items-center min-w-0">
        <span className="text-2xl mr-2">{getFlagEmoji(locale)}</span>
        <div className="min-w-0">
          <div className="font-medium truncate">
            {showNativeNames ? getLocaleInfo(locale).nativeName : getLocaleInfo(locale).name}
          </div>
          {showProgress && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {getProgress(locale)}% complete
            </div>
          )}
        </div>
      </div>
      
      <button 
        onClick={() => {
          const currentIndex = sortedLocales.indexOf(locale);
          const nextIndex = currentIndex < sortedLocales.length - 1 ? currentIndex + 1 : 0;
          handleLocaleChange(sortedLocales[nextIndex]);
        }}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Next language"
      >
        ▶
      </button>
    </div>
  );
}
