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

import React, { useState, useEffect, useCallback } from 'react';
import { useAdvancedI18n, type Locale } from '../contexts/advanced-i18n-context';
import type { AdvancedLanguageSwitcherProps } from './language-switcher/types';
import { getFlagEmoji } from './language-switcher/helpers';
import { GridLanguageSwitcher } from './language-switcher/GridLanguageSwitcher';
import { CarouselLanguageSwitcher } from './language-switcher/CarouselLanguageSwitcher';
import { CompactLanguageSwitcher } from './language-switcher/CompactLanguageSwitcher';
import { TabsLanguageSwitcher } from './language-switcher/TabsLanguageSwitcher';
import { FlagsLanguageSwitcher } from './language-switcher/FlagsLanguageSwitcher';
import { DropdownLanguageSwitcher } from './language-switcher/DropdownLanguageSwitcher';

export function AdvancedLanguageSwitcher({ 
  variant = 'dropdown',
  className = '',
  showProgress = false,
  showNativeNames = true,
  preloadOnHover = true,
  autoDetectLanguage = false,
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
    getBookmarks
  } = useAdvancedI18n();
  
  const [preloadedLocales, setPreloadedLocales] = useState<Set<Locale>>(new Set([locale]));
  const [bookmarkedLocales, setBookmarkedLocales] = useState<Set<Locale>>(new Set());

  // 自動言語検出
  useEffect(() => {
    if (autoDetectLanguage && typeof navigator !== 'undefined') {
      const userLanguage = navigator.language.split('-')[0] as Locale;
      if (availableLocales.includes(userLanguage) && userLanguage !== locale) {
        // 自動検出された言語に切り替え
        setLocale(userLanguage);
      }
    }
  }, [autoDetectLanguage, availableLocales, locale, setLocale]);

  // ブックマークされた言語の取得
  useEffect(() => {
    if (showBookmarks) {
      const bookmarks = getBookmarks();
      setBookmarkedLocales(new Set(bookmarks.map(b => b.locale)));
    }
  }, [showBookmarks, getBookmarks]);

  // 言語のソート
  const getSortedLocales = useCallback(() => {
    const sorted = [...availableLocales];
    
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

  // 言語切り替え処理
  const handleLocaleChange = useCallback(async (newLocale: Locale) => {
    if (newLocale !== locale) {
      setLocale(newLocale);
      
      // プリロードされていない場合は読み込み
      if (!preloadedLocales.has(newLocale)) {
        await preloadLocale(newLocale);
        setPreloadedLocales(prev => new Set([...prev, newLocale]));
      }
    }
  }, [locale, setLocale, preloadedLocales, preloadLocale]);

  // ホバー時のプリロード
  const handleMouseEnter = useCallback(async (targetLocale: Locale) => {
    if (preloadOnHover && !preloadedLocales.has(targetLocale)) {
      await preloadLocale(targetLocale);
      setPreloadedLocales(prev => new Set([...prev, targetLocale]));
    }
  }, [preloadOnHover, preloadedLocales, preloadLocale]);

  // 翻訳進捗の取得
  const getProgress = useCallback((localeCode: Locale) => {
    if (!showProgress) return null;
    const stats = getTranslationStats(localeCode);
    return stats.completionPercentage;
  }, [showProgress, getTranslationStats]);

  // 共通のprops
  const commonProps = {
    locale,
    availableLocales,
    showProgress,
    showNativeNames,
    preloadOnHover,
    showBookmarks,
    bookmarkedLocales,
    getFlagEmoji,
    getProgress,
    handleLocaleChange,
    handleMouseEnter,
    getLocaleInfo,
    getTextDirection
  };

  // Gridバリアント
  if (variant === 'grid') {
    return (
      <GridLanguageSwitcher
        {...commonProps}
        className={className}
        groupByRegion={groupByRegion}
        groupedLocales={getGroupedLocales()}
      />
    );
  }

  // Carouselバリアント
  if (variant === 'carousel') {
    return (
      <CarouselLanguageSwitcher
        {...commonProps}
        className={className}
        sortedLocales={getSortedLocales()}
      />
    );
  }

  // Compactバリアント
  if (variant === 'compact') {
    return (
      <CompactLanguageSwitcher
        locale={locale}
        availableLocales={availableLocales}
        className={className}
        getFlagEmoji={getFlagEmoji}
        getTextDirection={getTextDirection}
        handleLocaleChange={handleLocaleChange}
      />
    );
  }

  // Tabsバリアント
  if (variant === 'tabs') {
    return (
      <TabsLanguageSwitcher
        {...commonProps}
        className={className}
      />
    );
  }

  // Flagsバリアント
  if (variant === 'flags') {
    return (
      <FlagsLanguageSwitcher
        {...commonProps}
        className={className}
      />
    );
  }

  // Default: Dropdownバリアント
  return (
    <DropdownLanguageSwitcher
      {...commonProps}
      className={className}
      isRTL={isRTL}
    />
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
