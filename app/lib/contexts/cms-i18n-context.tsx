/**
 * CMS i18n Context
 * CMS管理画面専用の国際化コンテキスト
 * 
 * 機能:
 * - CMS管理画面専用の翻訳
 * - 管理者向けの言語機能
 * - ユーザー向けサイトとは独立した管理
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

export type CMSLocale = 'ja' | 'en';

interface CMSTranslationData {
  [key: string]: string | CMSTranslationData;
}

interface CMSNamespaceTranslations {
  [namespace: string]: CMSTranslationData;
}

interface CMSI18nContextType {
  locale: CMSLocale;
  setLocale: (locale: CMSLocale) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  availableLocales: readonly CMSLocale[];
  isLoading: boolean;
}

const CMSI18nContext = createContext<CMSI18nContextType | undefined>(undefined);

// CMS専用の翻訳データキャッシュ
const cmsTranslationCache: Record<CMSLocale, CMSNamespaceTranslations> = {} as Record<CMSLocale, CMSNamespaceTranslations>;

// ヘルパー関数: ネストしたオブジェクトから値を取得
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// ヘルパー関数: 変数補間
function interpolateString(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    if (value === null || value === undefined) {
      return match;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return match;
  });
}

// CMS翻訳データを読み込む関数
async function loadCMSTranslations(locale: CMSLocale): Promise<CMSNamespaceTranslations> {
  if (cmsTranslationCache[locale]) {
    return cmsTranslationCache[locale];
  }

  try {
    // CMS専用の名前空間
    const namespaces = ['admin', 'posts', 'users', 'media', 'settings', 'dashboard'];
    const promises = namespaces.map(async (namespace) => {
      try {
        const response = await fetch(`/locales/cms/${locale}/${namespace}.json`);
        if (response.ok) {
          return [namespace, await response.json()];
        }
        console.warn(`Failed to load CMS ${namespace} for ${locale}`);
        return [namespace, {}];
      } catch (error) {
        console.warn(`Error loading CMS ${namespace} for ${locale}:`, error);
        return [namespace, {}];
      }
    });

    const results = await Promise.all(promises);
    const translations = Object.fromEntries(results);
    
    cmsTranslationCache[locale] = translations;
    return translations;
  } catch (error) {
    console.error(`Failed to load CMS translations for locale: ${locale}`, error);
    return {};
  }
}

interface CMSI18nProviderProps {
  readonly children: ReactNode;
  readonly initialLocale?: CMSLocale;
  readonly fallbackLocale?: CMSLocale;
}

export function CMSI18nProvider({ 
  children, 
  initialLocale = 'ja',
  fallbackLocale = 'en'
}: CMSI18nProviderProps) {
  const [currentLocale, setCurrentLocale] = useState<CMSLocale>(initialLocale);
  const [translations, setTranslations] = useState<CMSNamespaceTranslations>({});
  const [fallbackTranslations, setFallbackTranslations] = useState<CMSNamespaceTranslations>({});
  const [isLoading, setIsLoading] = useState(true);

  // CMS翻訳データの読み込み
  useEffect(() => {
    const loadCMSLocaleData = async () => {
      setIsLoading(true);
      try {
        const [localeTranslations, fallbackData] = await Promise.all([
          loadCMSTranslations(currentLocale),
          loadCMSTranslations(fallbackLocale)
        ]);
        
        setTranslations(localeTranslations);
        setFallbackTranslations(fallbackData);
        
        // LocalStorageに保存（CMS専用キー）
        localStorage.setItem('cms-i18n-locale', currentLocale);
      } catch (error) {
        console.error('Failed to load CMS translation data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCMSLocaleData();
  }, [currentLocale, fallbackLocale]);

  // LocalStorageからCMS言語設定を復元
  useEffect(() => {
    const savedLocale = localStorage.getItem('cms-i18n-locale') as CMSLocale;
    if (savedLocale && ['ja', 'en'].includes(savedLocale)) {
      setCurrentLocale(savedLocale);
    }
  }, []);

  // CMS翻訳関数
  const t = useCallback((key: string, variables?: Record<string, string | number>): string => {
    const parts = key.split('.');
    const namespace = parts[0];
    const translationKey = parts.slice(1).join('.');
    
    let value = getNestedValue(translations[namespace], translationKey);
    
    if (!value || typeof value !== 'string') {
      // フォールバックを試行
      value = getNestedValue(fallbackTranslations[namespace], translationKey);
    }
    
    if (!value || typeof value !== 'string') {
      console.warn(`CMS translation missing for key: ${key}`);
      return key;
    }
    
    return variables ? interpolateString(value, variables) : value;
  }, [translations, fallbackTranslations]);

  // CMS言語切り替え
  const setLocale = useCallback((locale: CMSLocale) => {
    if (['ja', 'en'].includes(locale)) {
      setCurrentLocale(locale);
    }
  }, []);

  const contextValue = useMemo(() => ({
    locale: currentLocale,
    setLocale,
    t,
    availableLocales: ['ja', 'en'] as readonly CMSLocale[],
    isLoading
  }), [currentLocale, setLocale, t, isLoading]);

  return (
    <CMSI18nContext.Provider value={contextValue}>
      {children}
    </CMSI18nContext.Provider>
  );
}

export function useCMSI18n() {
  const context = useContext(CMSI18nContext);
  if (!context) {
    throw new Error('useCMSI18n must be used within a CMSI18nProvider');
  }
  return context;
}
