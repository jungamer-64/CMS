/**
 * i18n Context
 * 国際化対応のコンテキスト
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

export type Locale = 'ja' | 'en';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLocales: readonly Locale[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 翻訳データの型定義
type TranslationData = Record<string, unknown>;

// 翻訳データのキャッシュ
const translationCache: Record<string, TranslationData> = {};

// ネストしたオブジェクトから値を取得するヘルパー関数
function getNestedValue(obj: unknown, path: string): string | undefined {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj) as string | undefined;
}

// 翻訳関数
function translateText(
  translations: TranslationData,
  key: string,
  params?: Record<string, string | number>
): string {
  let text = getNestedValue(translations, key);
  
  if (!text || typeof text !== 'string') {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  
  // パラメータの置換
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text?.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
    });
  }
  
  return text || key;
}

// 翻訳データを読み込む関数
async function loadTranslations(locale: Locale): Promise<TranslationData> {
  const cacheKey = locale;
  
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }
  
  try {
    // 並列で全ての翻訳ファイルを読み込み
    const [common, admin, auth, errors] = await Promise.all([
      fetch(`/locales/${locale}/common.json`).then(res => res.json()),
      fetch(`/locales/${locale}/admin.json`).then(res => res.json()),
      fetch(`/locales/${locale}/auth.json`).then(res => res.json()),
      fetch(`/locales/${locale}/errors.json`).then(res => res.json()),
    ]);
    
    // 翻訳データを統合
    const translations = {
      common,
      admin,
      auth,
      errors,
    };
    
    translationCache[cacheKey] = translations;
    return translations;
  } catch (error) {
    console.error(`Failed to load translations for locale: ${locale}`, error);
    return {};
  }
}

interface I18nProviderProps {
  readonly children: ReactNode;
  readonly initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale = 'ja' }: I18nProviderProps) {
  const [currentLocale, setCurrentLocale] = useState<Locale>(initialLocale);
  const [translations, setTranslations] = useState<TranslationData>({});

  // ロケールを変更する関数
  const setLocale = useCallback((newLocale: Locale) => {
    setCurrentLocale(newLocale);
    
    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', newLocale);
    }
  }, []);

  // 翻訳関数
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    return translateText(translations, key, params);
  }, [translations]);

  // ロケール変更時に翻訳データを読み込み
  useEffect(() => {
    loadTranslations(currentLocale).then(setTranslations);
  }, [currentLocale]);

  // 初期ロケールの設定（ローカルストレージから読み込み）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('preferred-locale') as Locale;
      if (savedLocale && (savedLocale === 'ja' || savedLocale === 'en')) {
        setCurrentLocale(savedLocale);
      }
    }
  }, []);

  const value: I18nContextType = useMemo(() => ({
    locale: currentLocale,
    setLocale,
    t,
    availableLocales: ['ja', 'en'] as const,
  }), [currentLocale, setLocale, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export default I18nContext;
