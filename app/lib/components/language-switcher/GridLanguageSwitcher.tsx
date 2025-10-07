/**
 * Grid Language Switcher Component
 * グリッド形式の言語切り替えコンポーネント
 */

'use client';

import React from 'react';
import type { LanguageSwitcherCommonProps } from './types';

interface GridLanguageSwitcherProps extends LanguageSwitcherCommonProps {
  readonly className?: string;
  readonly groupByRegion?: boolean;
  readonly groupedLocales: Record<string, readonly string[]>;
}

export function GridLanguageSwitcher({
  locale,
  className = '',
  groupByRegion = false,
  groupedLocales,
  showProgress,
  showBookmarks,
  bookmarkedLocales,
  getFlagEmoji,
  getProgress,
  getLocaleInfo,
  getTextDirection,
  handleLocaleChange,
  handleMouseEnter
}: GridLanguageSwitcherProps) {
  return (
    <div className={`${className}`} dir={getTextDirection()}>
      {Object.entries(groupedLocales).map(([region, locales]) => (
        <div key={region} className="mb-4">
          {groupByRegion && (
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              {region}
            </h3>
          )}
          <div className="grid grid-cols-4 gap-2">
            {locales.map((localeCode) => {
              const localeInfo = getLocaleInfo(localeCode as never);
              const isActive = localeCode === locale;
              const progress = getProgress(localeCode as never);
              
              return (
                <button
                  key={localeCode}
                  onClick={() => handleLocaleChange(localeCode as never)}
                  onMouseEnter={() => handleMouseEnter(localeCode as never)}
                  className={`relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    isActive 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  title={localeInfo.nativeName}
                >
                  <div className="text-2xl mb-1">{getFlagEmoji(localeCode as never)}</div>
                  <div className="text-xs font-medium">{localeCode.toUpperCase()}</div>
                  {showProgress && progress !== null && (
                    <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300" 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                  )}
                  {showBookmarks && bookmarkedLocales?.has(localeCode as never) && (
                    <div className="absolute top-1 right-1 text-yellow-500">⭐</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
