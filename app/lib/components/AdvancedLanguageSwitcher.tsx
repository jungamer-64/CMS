/**
 * Advanced Language Switcher Component
 * 高度な言語切り替えコンポーネント
 * 
 * 機能:
 * - 多言語サポート
 * - RTL言語対応
 * - 翻訳進捗表示
 * - 言語プリローディング
 * - アクセシビリティ対応
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAdvancedI18n, type Locale } from '../contexts/advanced-i18n-context';

interface AdvancedLanguageSwitcherProps {
  readonly variant?: 'dropdown' | 'tabs' | 'flags' | 'compact' | 'grid' | 'carousel';
  readonly className?: string;
  readonly showProgress?: boolean;
  readonly showNativeNames?: boolean;
  readonly preloadOnHover?: boolean;
  readonly autoDetectLanguage?: boolean;
  readonly enableTranslationMemory?: boolean;
  readonly showBookmarks?: boolean;
  readonly groupByRegion?: boolean;
  readonly sortBy?: 'alphabetical' | 'usage' | 'completion';
}

export function AdvancedLanguageSwitcher({ 
  variant = 'dropdown',
  className = '',
  showProgress = false,
  showNativeNames = true,
  preloadOnHover = true,
  autoDetectLanguage = false,
  enableTranslationMemory = false,
  showBookmarks = false,
  groupByRegion = false,
  sortBy = 'alphabetical'
}: AdvancedLanguageSwitcherProps) {
  const { 
    locale, 
    setLocale, 
    availableLocales, 
    getLocaleInfo, 
    getTranslationStats,
    preloadLocale,
    isRTL,
    getTextDirection,
    detectLanguage,
    getBookmarks
  } = useAdvancedI18n();
  
  const [isOpen, setIsOpen] = useState(false);
  const [preloadedLocales, setPreloadedLocales] = useState<Set<Locale>>(new Set([locale]));
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [bookmarkedLocales, setBookmarkedLocales] = useState<Set<Locale>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 自動言語検出
  useEffect(() => {
    if (autoDetectLanguage && typeof navigator !== 'undefined') {
      const userLanguage = navigator.language.split('-')[0] as Locale;
      if (availableLocales.includes(userLanguage) && userLanguage !== locale) {
        setDetectedLanguage(userLanguage);
      }
    }
  }, [autoDetectLanguage, availableLocales, locale]);

  // ブックマークされた言語の取得
  useEffect(() => {
    if (showBookmarks) {
      const bookmarks = getBookmarks();
      setBookmarkedLocales(new Set(bookmarks.map(b => b.locale)));
    }
  }, [showBookmarks, getBookmarks]);

  // 言語のソート
  const getSortedLocales = useCallback(() => {
    let sorted = [...availableLocales];
    
    switch (sortBy) {
      case 'alphabetical':
        sorted.sort((a, b) => getLocaleInfo(a).nativeName.localeCompare(getLocaleInfo(b).nativeName));
        break;
      case 'completion':
        sorted.sort((a, b) => {
          const aStats = getTranslationStats(a);
          const bStats = getTranslationStats(b);
          return bStats.completionPercentage - aStats.completionPercentage;
        });
        break;
      case 'usage':
        // 使用頻度でソート（実装は簡略化）
        sorted.sort((a, b) => {
          if (a === locale) return -1;
          if (b === locale) return 1;
          return 0;
        });
        break;
    }
    
    return sorted;
  }, [availableLocales, sortBy, getLocaleInfo, getTranslationStats, locale]);

  // 地域でグループ化
  const getGroupedLocales = useCallback(() => {
    if (!groupByRegion) return { all: getSortedLocales() };
    
    const groups: Record<string, Locale[]> = {};
    getSortedLocales().forEach(localeCode => {
      const info = getLocaleInfo(localeCode);
      const region = info.region || 'Other';
      if (!groups[region]) groups[region] = [];
      groups[region].push(localeCode);
    });
    
    return groups;
  }, [groupByRegion, getSortedLocales, getLocaleInfo]);

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

  // 言語切り替え処理
  const handleLocaleChange = async (newLocale: Locale) => {
    if (newLocale !== locale) {
      setLocale(newLocale);
      setIsOpen(false);
      
      // プリロードされていない場合は読み込み
      if (!preloadedLocales.has(newLocale)) {
        await preloadLocale(newLocale);
        setPreloadedLocales(prev => new Set([...prev, newLocale]));
      }
    }
  };

  // ホバー時のプリロード
  const handleMouseEnter = async (targetLocale: Locale) => {
    if (preloadOnHover && !preloadedLocales.has(targetLocale)) {
      await preloadLocale(targetLocale);
      setPreloadedLocales(prev => new Set([...prev, targetLocale]));
    }
  };

  // 言語フラグの取得
  const getFlagEmoji = (localeCode: Locale): string => {
    const flags: Record<Locale, string> = {
      ja: '🇯🇵',
      en: '🇺🇸',
      fr: '🇫🇷',
      de: '🇩🇪',
      ko: '🇰🇷',
      zh: '🇨🇳',
      ar: '🇸🇦',
      es: '🇪🇸',
      it: '🇮🇹',
      pt: '🇵🇹',
      ru: '🇷🇺',
      hi: '🇮🇳',
      th: '🇹🇭',
      vi: '🇻🇳',
      ms: '🇲🇾',
      tl: '🇵🇭'
    };
    return flags[localeCode] || '🌐';
  };

  // 翻訳進捗の取得
  const getProgress = (localeCode: Locale) => {
    if (!showProgress) return null;
    const stats = getTranslationStats(localeCode);
    return stats.completionPercentage;
  };

  if (variant === 'grid') {
    const groupedLocales = getGroupedLocales();
    
    return (
      <div className={`${className}`} dir={getTextDirection()}>
        {Object.entries(groupedLocales).map(([region, locales]) => (
          <div key={region} className="mb-4">
            {groupByRegion && <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{region}</h3>}
            <div className="grid grid-cols-4 gap-2">
              {locales.map((localeCode) => {
                const localeInfo = getLocaleInfo(localeCode);
                const isActive = localeCode === locale;
                const progress = getProgress(localeCode);
                
                return (
                  <button
                    key={localeCode}
                    onClick={() => handleLocaleChange(localeCode)}
                    onMouseEnter={() => handleMouseEnter(localeCode)}
                    className={`relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    title={localeInfo.nativeName}
                  >
                    <div className="text-2xl mb-1">{getFlagEmoji(localeCode)}</div>
                    <div className="text-xs font-medium">{localeCode.toUpperCase()}</div>
                    {showProgress && progress !== null && (
                      <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-300" 
                             style={{ width: `${progress}%` }} />
                      </div>
                    )}
                    {showBookmarks && bookmarkedLocales.has(localeCode) && (
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

  if (variant === 'carousel') {
    return (
      <div className={`flex items-center space-x-2 ${className}`} dir={getTextDirection()}>
        <button 
          onClick={() => {
            const sorted = getSortedLocales();
            const currentIndex = sorted.indexOf(locale);
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : sorted.length - 1;
            handleLocaleChange(sorted[prevIndex]);
          }}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
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
            const sorted = getSortedLocales();
            const currentIndex = sorted.indexOf(locale);
            const nextIndex = currentIndex < sorted.length - 1 ? currentIndex + 1 : 0;
            handleLocaleChange(sorted[nextIndex]);
          }}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          ▶
        </button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={() => {
          const currentIndex = availableLocales.indexOf(locale);
          const nextIndex = (currentIndex + 1) % availableLocales.length;
          handleLocaleChange(availableLocales[nextIndex]);
        }}
        className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
        title="Toggle Language"
        dir={getTextDirection()}
      >
        <span className="mr-1">{getFlagEmoji(locale)}</span>
        <span className="uppercase">{locale}</span>
      </button>
    );
  }

  if (variant === 'tabs') {
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
                <div className="absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all duration-300" 
                     style={{ width: `${progress}%` }} />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'flags') {
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
                  <div className="h-full bg-green-500 transition-all duration-300" 
                       style={{ width: `${progress}%` }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: dropdown variant
  const currentLocaleInfo = getLocaleInfo(locale);
  
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
                    onClick={() => handleLocaleChange(localeCode)}
                    onMouseEnter={() => handleMouseEnter(localeCode)}
                    className={`relative w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors ${
                      isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
                    }`}
                    dir={localeInfo.isRTL ? 'rtl' : 'ltr'}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center min-w-0 flex-1">
                        <span className={`text-lg flex-shrink-0 ${localeInfo.isRTL ? 'ml-3' : 'mr-3'}`}>{getFlagEmoji(localeCode)}</span>
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

// RTL対応のスタイルヘルパー
export function RTLStyleProvider({ children }: { readonly children: React.ReactNode }) {
  const { isRTL, getTextDirection } = useAdvancedI18n();
  
  useEffect(() => {
    document.documentElement.dir = getTextDirection();
    document.documentElement.lang = document.documentElement.lang || 'ja';
  }, [isRTL, getTextDirection]);

  return <>{children}</>;
}

// 翻訳統計表示コンポーネント
export function TranslationStats({ locale }: { readonly locale?: Locale }) {
  const { getTranslationStats, locale: currentLocale } = useAdvancedI18n();
  const stats = getTranslationStats(locale || currentLocale);

  // Helper function for completion percentage color
  const getCompletionColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Translation Statistics</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total Keys:</span>
          <span className="font-mono">{stats.totalKeys}</span>
        </div>
        <div className="flex justify-between">
          <span>Translated:</span>
          <span className="font-mono text-green-600">{stats.translatedKeys}</span>
        </div>
        <div className="flex justify-between">
          <span>Missing:</span>
          <span className="font-mono text-red-600">{stats.missingKeys.length}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Completion:</span>
          <span className={`font-mono ${getCompletionColor(stats.completionPercentage)}`}>
            {stats.completionPercentage}%
          </span>
        </div>
        <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
            style={{ width: `${stats.completionPercentage}%` }}
          />
        </div>
      </div>
      {stats.missingKeys.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            View Missing Keys ({stats.missingKeys.length})
          </summary>
          <div className="mt-2 max-h-32 overflow-y-auto">
            <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
              {stats.missingKeys.map((key) => (
                <li key={key} className="font-mono">{key}</li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </div>
  );
}
