/**
 * Advanced i18n Context
 * 高度な国際化対応のコンテキスト
 * 
 * 機能:
 * - 複数形対応
 * - 変数補間
 * - 日付・数値フォーマット
 * - RTL対応
 * - 通貨フォーマット
 * - フォールバック翻訳
 * - 翻訳プリローディング
 * - 翻訳統計
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

export type Locale = 'ja' | 'en' | 'fr' | 'de' | 'ko' | 'zh' | 'ar' | 'es' | 'it' | 'pt' | 'ru' | 'hi' | 'th' | 'vi' | 'ms' | 'tl';

interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  isRTL: boolean;
  dateFormat: string;
  numberFormat: Intl.NumberFormatOptions;
  currencyCode: string;
  pluralRule?: string;
  scriptDirection?: 'horizontal' | 'vertical';
  calendar?: string;
  firstDayOfWeek?: number;
  region?: string;
  emoji?: string;
}

interface PluralRule {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

interface TranslationStats {
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  completionPercentage: number;
  lastUpdated?: Date;
  translationQuality?: number;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

interface LanguageDetection {
  detected: Locale;
  confidence: number;
  alternatives: Array<{ locale: Locale; confidence: number }>;
}

interface TranslationMemory {
  source: string;
  target: string;
  locale: Locale;
  quality: number;
  lastUsed: Date;
}

interface Bookmark {
  key: string;
  locale: Locale;
  note?: string;
  category?: string;
  createdAt: Date;
}

interface TranslationSession {
  id: string;
  locale: Locale;
  startTime: Date;
  translatedKeys: string[];
  timeSpent: number;
  quality: number;
}

interface I18nPlugin {
  name: string;
  version: string;
  initialize: (context: AdvancedI18nContextType) => void;
  destroy: () => void;
  hooks?: {
    beforeTranslation?: (key: string, locale: Locale) => void;
    afterTranslation?: (key: string, locale: Locale, result: string) => void;
    onLocaleChange?: (oldLocale: Locale, newLocale: Locale) => void;
  };
}

interface AdvancedI18nContextType {
  // 基本機能
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  
  // 複数形対応
  tn: (key: string, count: number, variables?: Record<string, string | number>) => string;
  
  // 利用可能な言語
  availableLocales: readonly Locale[];
  getLocaleInfo: (locale: Locale) => LocaleInfo;
  
  // フォーマット機能
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatRelativeTime: (date: Date | string) => string;
  formatList: (items: string[], options?: Intl.ListFormatOptions) => string;
  formatUnit: (value: number, unit: string) => string;
  
  // RTL対応
  isRTL: boolean;
  getTextDirection: () => 'ltr' | 'rtl';
  
  // 翻訳管理
  preloadLocale: (locale: Locale) => Promise<void>;
  getTranslationStats: (locale?: Locale) => TranslationStats;
  addTranslations: (locale: Locale, namespace: string, translations: Record<string, unknown>) => void;
  
  // 高度な機能
  interpolate: (template: string, variables: Record<string, unknown>) => string;
  hasTranslation: (key: string, locale?: Locale) => boolean;
  getTranslationWithFallback: (key: string, fallbackLocales?: Locale[]) => string;
  
  // 新機能: 言語検出
  detectLanguage: (text: string) => LanguageDetection;
  
  // 新機能: 翻訳メモリ
  saveToMemory: (source: string, target: string, locale: Locale, quality?: number) => void;
  searchMemory: (source: string, locale: Locale) => TranslationMemory[];
  
  // 新機能: ブックマーク
  bookmarkTranslation: (key: string, locale: Locale, note?: string, category?: string) => void;
  getBookmarks: (locale?: Locale, category?: string) => Bookmark[];
  removeBookmark: (key: string, locale: Locale) => void;
  
  // 新機能: 翻訳セッション
  startTranslationSession: (locale: Locale) => string;
  endTranslationSession: (sessionId: string) => TranslationSession;
  getActiveSessions: () => TranslationSession[];
  
  // 新機能: 品質管理
  validateTranslation: (key: string, locale: Locale) => { isValid: boolean; issues: string[] };
  suggestTranslation: (key: string, targetLocale: Locale) => string;
  
  // 新機能: バッチ操作
  bulkTranslate: (keys: string[], targetLocale: Locale) => Promise<Record<string, string>>;
  exportTranslations: (locale: Locale, format: 'json' | 'csv' | 'xlsx') => Promise<Blob>;
  importTranslations: (locale: Locale, data: File | string) => Promise<void>;
  
  // 新機能: プラグインサポート
  registerPlugin: (name: string, plugin: I18nPlugin) => void;
  unregisterPlugin: (name: string) => void;
  getPlugins: () => Record<string, I18nPlugin>;
}

// 言語情報の定義
const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    isRTL: false,
    dateFormat: 'YYYY年MM月DD日',
    numberFormat: { style: 'decimal' },
    currencyCode: 'JPY',
    pluralRule: 'other',
    calendar: 'gregorian',
    firstDayOfWeek: 0,
    region: 'JP',
    emoji: '🇯🇵'
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    isRTL: false,
    dateFormat: 'MM/DD/YYYY',
    numberFormat: { style: 'decimal' },
    currencyCode: 'USD',
    pluralRule: 'one/other',
    calendar: 'gregorian',
    firstDayOfWeek: 0,
    region: 'US',
    emoji: '🇺🇸'
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { style: 'decimal' },
    currencyCode: 'EUR',
    pluralRule: 'one/other',
    calendar: 'gregorian',
    firstDayOfWeek: 1,
    region: 'FR',
    emoji: '🇫🇷'
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    isRTL: false,
    dateFormat: 'DD.MM.YYYY',
    numberFormat: { style: 'decimal' },
    currencyCode: 'EUR',
    pluralRule: 'one/other',
    calendar: 'gregorian',
    firstDayOfWeek: 1,
    region: 'DE',
    emoji: '🇩🇪'
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    isRTL: false,
    dateFormat: 'YYYY년 MM월 DD일',
    numberFormat: { style: 'decimal' },
    currencyCode: 'KRW',
    pluralRule: 'other',
    calendar: 'gregorian',
    firstDayOfWeek: 0,
    region: 'KR',
    emoji: '🇰🇷'
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    isRTL: false,
    dateFormat: 'YYYY年MM月DD日',
    numberFormat: { style: 'decimal' },
    currencyCode: 'CNY',
    pluralRule: 'other',
    calendar: 'gregorian',
    firstDayOfWeek: 1,
    region: 'CN',
    emoji: '🇨🇳'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    isRTL: true,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { style: 'decimal' },
    currencyCode: 'SAR',
    pluralRule: 'zero/one/two/few/many/other',
    calendar: 'islamic',
    firstDayOfWeek: 6,
    region: 'SA',
    emoji: '🇸🇦'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { style: 'decimal' },
    currencyCode: 'EUR',
    pluralRule: 'one/other',
    calendar: 'gregorian',
    firstDayOfWeek: 1,
    region: 'ES',
    emoji: '🇪🇸'
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { style: 'decimal' },
    currencyCode: 'EUR',
    pluralRule: 'one/other',
    calendar: 'gregorian',
    firstDayOfWeek: 1,
    region: 'IT',
    emoji: '🇮🇹'
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { style: 'decimal' },
    currencyCode: 'EUR',
    pluralRule: 'one/other',
    calendar: 'gregorian',
    firstDayOfWeek: 1,
    region: 'PT',
    emoji: '🇵🇹'
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    isRTL: false,
    dateFormat: 'DD.MM.YYYY',
    numberFormat: { style: 'decimal' },
    currencyCode: 'RUB',
    pluralRule: 'one/few/many/other',
    calendar: 'gregorian',
    firstDayOfWeek: 1,
    region: 'RU',
    emoji: '🇷🇺'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { style: 'decimal' },
    currencyCode: 'INR',
    pluralRule: 'one/other',
    calendar: 'gregorian',
    firstDayOfWeek: 0,
    region: 'IN',
    emoji: '🇮🇳'
  },
  th: {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { style: 'decimal' },
    currencyCode: 'THB',
    pluralRule: 'other',
    calendar: 'buddhist',
    firstDayOfWeek: 0,
    region: 'TH',
    emoji: '🇹🇭'
  },
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { style: 'decimal' },
    currencyCode: 'VND',
    pluralRule: 'other',
    calendar: 'gregorian',
    firstDayOfWeek: 1,
    region: 'VN',
    emoji: '🇻🇳'
  },
  ms: {
    code: 'ms',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { style: 'decimal' },
    currencyCode: 'MYR',
    pluralRule: 'other',
    calendar: 'gregorian',
    firstDayOfWeek: 1,
    region: 'MY',
    emoji: '🇲🇾'
  },
  tl: {
    code: 'tl',
    name: 'Filipino',
    nativeName: 'Filipino',
    isRTL: false,
    dateFormat: 'MM/DD/YYYY',
    numberFormat: { style: 'decimal' },
    currencyCode: 'PHP',
    pluralRule: 'one/other',
    calendar: 'gregorian',
    firstDayOfWeek: 0,
    region: 'PH',
    emoji: '🇵🇭'
  }
};

const AdvancedI18nContext = createContext<AdvancedI18nContextType | undefined>(undefined);

// 翻訳データの型定義
type TranslationData = Record<string, unknown>;
type NamespaceTranslations = Record<string, TranslationData>;

// 翻訳データのキャッシュ
const translationCache: Record<Locale, NamespaceTranslations> = {} as Record<Locale, NamespaceTranslations>;

// 新機能用のデータストレージ
const translationMemory: TranslationMemory[] = [];
const bookmarks: Bookmark[] = [];
const activeSessions: TranslationSession[] = [];
const plugins: Record<string, I18nPlugin> = {};

// 言語検出用の簡単なヒューリスティック
const languagePatterns: Record<Locale, RegExp[]> = {
  ja: [/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/],
  ko: [/[\uAC00-\uD7AF]/],
  zh: [/[\u4E00-\u9FFF]/],
  ar: [/[\u0600-\u06FF]/],
  hi: [/[\u0900-\u097F]/],
  th: [/[\u0E00-\u0E7F]/],
  vi: [/[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i],
  en: [/^[a-zA-Z\s.,!?;:'"()-]+$/],
  fr: [/[àâäçéèêëïîôùûüÿæœ]/i],
  de: [/[äöüß]/i],
  es: [/[ñáéíóúü]/i],
  it: [/[àèéìíîòóù]/i],
  pt: [/[ãáàâçéêíóôõú]/i],
  ru: [/[\u0400-\u04FF]/],
  ms: [/^[a-zA-Z\s.,!?;:'"()-]+$/],
  tl: [/^[a-zA-Z\s.,!?;:'"()-]+$/]
};

// ヘルパー関数: ネストしたオブジェクトから値を取得
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// ヘルパー関数: 複数形ルールの選択
function selectPluralRule(count: number, locale: Locale): keyof PluralRule {
  const pluralRules = new Intl.PluralRules(locale);
  return pluralRules.select(count) as keyof PluralRule;
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
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return match;
  });
}

// 翻訳データを読み込む関数
async function loadTranslations(locale: Locale): Promise<NamespaceTranslations> {
  if (translationCache[locale]) {
    return translationCache[locale];
  }

  try {
    const namespaces = ['common', 'admin', 'auth', 'errors'];
    const promises = namespaces.map(async (namespace) => {
      try {
        const response = await fetch(`/locales/${locale}/${namespace}.json`);
        if (response.ok) {
          return [namespace, await response.json()];
        }
        console.warn(`Failed to load ${namespace} for ${locale}`);
        return [namespace, {}];
      } catch (error) {
        console.warn(`Error loading ${namespace} for ${locale}:`, error);
        return [namespace, {}];
      }
    });

    const results = await Promise.all(promises);
    const translations = Object.fromEntries(results);
    
    translationCache[locale] = translations;
    return translations;
  } catch (error) {
    console.error(`Failed to load translations for locale: ${locale}`, error);
    return {};
  }
}

interface AdvancedI18nProviderProps {
  readonly children: ReactNode;
  readonly initialLocale?: Locale;
  readonly fallbackLocale?: Locale;
}

export function AdvancedI18nProvider({ 
  children, 
  initialLocale = 'ja',
  fallbackLocale = 'en'
}: AdvancedI18nProviderProps) {
  const [currentLocale, setCurrentLocale] = useState<Locale>(initialLocale);
  const [translations, setTranslations] = useState<NamespaceTranslations>({});
  const [fallbackTranslations, setFallbackTranslations] = useState<NamespaceTranslations>({});

  // 翻訳データの読み込み
  useEffect(() => {
    const loadLocaleData = async () => {
      try {
        const [localeTranslations, fallbackData] = await Promise.all([
          loadTranslations(currentLocale),
          loadTranslations(fallbackLocale)
        ]);
        
        setTranslations(localeTranslations);
        setFallbackTranslations(fallbackData);
        
        // LocalStorageに保存
        localStorage.setItem('i18n-locale', currentLocale);
      } catch (error) {
        console.error('Failed to load translation data:', error);
      }
    };

    loadLocaleData();
  }, [currentLocale, fallbackLocale]);

  // LocalStorageから言語設定を復元
  useEffect(() => {
    const savedLocale = localStorage.getItem('i18n-locale') as Locale;
    if (savedLocale && Object.keys(LOCALE_INFO).includes(savedLocale)) {
      setCurrentLocale(savedLocale);
    }
  }, []);

  // 翻訳関数
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
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    return variables ? interpolateString(value, variables) : value;
  }, [translations, fallbackTranslations]);

  // 複数形対応翻訳関数
  const tn = useCallback((key: string, count: number, variables?: Record<string, string | number>): string => {
    const parts = key.split('.');
    const namespace = parts[0];
    const translationKey = parts.slice(1).join('.');
    
    let pluralData = getNestedValue(translations[namespace], translationKey) as PluralRule;
    
    if (!pluralData || typeof pluralData !== 'object') {
      pluralData = getNestedValue(fallbackTranslations[namespace], translationKey) as PluralRule;
    }
    
    if (!pluralData || typeof pluralData !== 'object') {
      console.warn(`Plural translation missing for key: ${key}`);
      return key;
    }
    
    const rule = selectPluralRule(count, currentLocale);
    const template = pluralData[rule] || pluralData.other || key;
    
    const allVariables = { ...variables, count };
    return interpolateString(template, allVariables);
  }, [translations, fallbackTranslations, currentLocale]);

  // 言語切り替え
  const setLocale = useCallback((locale: Locale) => {
    if (Object.keys(LOCALE_INFO).includes(locale)) {
      setCurrentLocale(locale);
    }
  }, []);

  // プリロード機能
  const preloadLocale = useCallback(async (locale: Locale) => {
    if (!translationCache[locale]) {
      await loadTranslations(locale);
    }
  }, []);

  // フォーマット機能
  const formatDate = useCallback((date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(currentLocale, options).format(dateObj);
  }, [currentLocale]);

  const formatNumber = useCallback((num: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(currentLocale, options).format(num);
  }, [currentLocale]);

  const formatCurrency = useCallback((amount: number, currency?: string) => {
    const currencyCode = currency || LOCALE_INFO[currentLocale].currencyCode;
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  }, [currentLocale]);

  const formatRelativeTime = useCallback((date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' });
    
    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (Math.abs(diffInSeconds) < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (Math.abs(diffInSeconds) < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    }
  }, [currentLocale]);

  const formatList = useCallback((items: string[], options?: Intl.ListFormatOptions) => {
    const listFormat = new Intl.ListFormat(currentLocale, options);
    return listFormat.format(items);
  }, [currentLocale]);

  const formatUnit = useCallback((value: number, unit: string) => {
    if (typeof Intl.NumberFormat.prototype.formatToParts !== 'undefined') {
      try {
        const formatter = new Intl.NumberFormat(currentLocale, {
          style: 'unit',
          unit: unit as any
        });
        return formatter.format(value);
      } catch {
        return `${value} ${unit}`;
      }
    }
    return `${value} ${unit}`;
  }, [currentLocale]);

  // 翻訳統計のためのヘルパー関数
  const countTranslationKeys = useCallback((
    obj: unknown, 
    namespace: string, 
    stats: { total: number; translated: number; missing: string[] },
    prefix = ''
  ) => {
    if (typeof obj !== 'object' || obj === null) return;
    
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') {
        stats.total++;
        if (value.trim() !== '') {
          stats.translated++;
        } else {
          stats.missing.push(`${namespace}.${fullKey}`);
        }
      } else if (typeof value === 'object') {
        countTranslationKeys(value, namespace, stats, fullKey);
      }
    });
  }, []);

  // 翻訳統計
  const getTranslationStats = useCallback((locale?: Locale): TranslationStats => {
    const targetLocale = locale || currentLocale;
    const localeTranslations = translationCache[targetLocale] || {};
    
    const stats = { total: 0, translated: 0, missing: [] as string[] };
    
    Object.entries(localeTranslations).forEach(([namespace, nsTranslations]) => {
      countTranslationKeys(nsTranslations, namespace, stats);
    });
    
    return {
      totalKeys: stats.total,
      translatedKeys: stats.translated,
      missingKeys: stats.missing,
      completionPercentage: stats.total > 0 ? Math.round((stats.translated / stats.total) * 100) : 0
    };
  }, [currentLocale, countTranslationKeys]);

  // 追加の翻訳データ
  const addTranslations = useCallback((locale: Locale, namespace: string, newTranslations: Record<string, unknown>) => {
    if (!translationCache[locale]) {
      translationCache[locale] = {};
    }
    
    translationCache[locale][namespace] = {
      ...translationCache[locale][namespace],
      ...newTranslations
    };
    
    if (locale === currentLocale) {
      setTranslations(prev => ({
        ...prev,
        [namespace]: {
          ...prev[namespace],
          ...newTranslations
        }
      }));
    }
  }, [currentLocale]);

  // 新機能: 言語検出
  const detectLanguage = useCallback((text: string): LanguageDetection => {
    const scores: Array<{ locale: Locale; confidence: number }> = [];
    
    Object.entries(languagePatterns).forEach(([locale, patterns]) => {
      let confidence = 0;
      patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          confidence += matches.length / text.length;
        }
      });
      if (confidence > 0) {
        scores.push({ locale: locale as Locale, confidence });
      }
    });
    
    scores.sort((a, b) => b.confidence - a.confidence);
    
    return {
      detected: scores[0]?.locale || 'en',
      confidence: scores[0]?.confidence || 0,
      alternatives: scores.slice(1, 4)
    };
  }, []);

  // 新機能: 翻訳メモリ
  const saveToMemory = useCallback((source: string, target: string, locale: Locale, quality = 1) => {
    const existing = translationMemory.find(
      item => item.source === source && item.locale === locale
    );
    
    if (existing) {
      existing.target = target;
      existing.quality = quality;
      existing.lastUsed = new Date();
    } else {
      translationMemory.push({
        source,
        target,
        locale,
        quality,
        lastUsed: new Date()
      });
    }
  }, []);

  const searchMemory = useCallback((source: string, locale: Locale): TranslationMemory[] => {
    return translationMemory
      .filter(item => 
        item.locale === locale && 
        (item.source.includes(source) || source.includes(item.source))
      )
      .sort((a, b) => b.quality - a.quality || b.lastUsed.getTime() - a.lastUsed.getTime());
  }, []);

  // 新機能: ブックマーク
  const bookmarkTranslation = useCallback((key: string, locale: Locale, note?: string, category?: string) => {
    const existing = bookmarks.find(bookmark => bookmark.key === key && bookmark.locale === locale);
    if (!existing) {
      bookmarks.push({
        key,
        locale,
        note,
        category,
        createdAt: new Date()
      });
    }
  }, []);

  const getBookmarks = useCallback((locale?: Locale, category?: string): Bookmark[] => {
    return bookmarks.filter(bookmark => 
      (!locale || bookmark.locale === locale) &&
      (!category || bookmark.category === category)
    );
  }, []);

  const removeBookmark = useCallback((key: string, locale: Locale) => {
    const index = bookmarks.findIndex(bookmark => bookmark.key === key && bookmark.locale === locale);
    if (index > -1) {
      bookmarks.splice(index, 1);
    }
  }, []);

  // 新機能: 翻訳セッション
  const startTranslationSession = useCallback((locale: Locale): string => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    activeSessions.push({
      id: sessionId,
      locale,
      startTime: new Date(),
      translatedKeys: [],
      timeSpent: 0,
      quality: 0
    });
    return sessionId;
  }, []);

  const endTranslationSession = useCallback((sessionId: string): TranslationSession => {
    const sessionIndex = activeSessions.findIndex(session => session.id === sessionId);
    if (sessionIndex > -1) {
      const session = activeSessions[sessionIndex];
      session.timeSpent = Date.now() - session.startTime.getTime();
      activeSessions.splice(sessionIndex, 1);
      return session;
    }
    throw new Error('Session not found');
  }, []);

  const getActiveSessions = useCallback((): TranslationSession[] => {
    return [...activeSessions];
  }, []);

  // フォールバック翻訳関数
  const getTranslationWithFallback = useCallback((key: string, fallbackLocales?: Locale[]) => {
    const locales = fallbackLocales || [currentLocale, fallbackLocale];
    for (const locale of locales) {
      const parts = key.split('.');
      const namespace = parts[0];
      const translationKey = parts.slice(1).join('.');
      const localeData = translationCache[locale];
      if (localeData) {
        const value = getNestedValue(localeData[namespace], translationKey);
        if (value && typeof value === 'string') {
          return value;
        }
      }
    }
    return key;
  }, [currentLocale, fallbackLocale]);

  // 新機能: 品質管理
  const validateTranslation = useCallback((key: string, locale: Locale) => {
    const issues: string[] = [];
    const translation = getNestedValue(translationCache[locale], key);
    
    if (!translation || typeof translation !== 'string') {
      issues.push('Translation missing');
    } else {
      if (translation.length === 0) {
        issues.push('Empty translation');
      }
      if (translation === key) {
        issues.push('Translation same as key');
      }
      // 変数プレースホルダーのチェック
      const keyVariables = (key.match(/\{\{(\w+)\}\}/g) || []);
      const translationVariables = (translation.match(/\{\{(\w+)\}\}/g) || []);
      if (keyVariables.length !== translationVariables.length) {
        issues.push('Variable placeholder mismatch');
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }, []);

  const suggestTranslation = useCallback((key: string, targetLocale: Locale): string => {
    // 翻訳メモリを検索
    const memoryResults = searchMemory(key, targetLocale);
    if (memoryResults.length > 0) {
      return memoryResults[0].target;
    }
    
    // フォールバック言語から提案
    const fallbackTranslation = getTranslationWithFallback(key, [targetLocale, fallbackLocale]);
    if (fallbackTranslation !== key) {
      return fallbackTranslation;
    }
    
    return key;
  }, [searchMemory, getTranslationWithFallback, fallbackLocale]);

  // 新機能: バッチ操作
  const bulkTranslate = useCallback(async (keys: string[], targetLocale: Locale): Promise<Record<string, string>> => {
    const results: Record<string, string> = {};
    
    keys.forEach(key => {
      const parts = key.split('.');
      const namespace = parts[0];
      const translationKey = parts.slice(1).join('.');
      const localeData = translationCache[targetLocale];
      
      if (localeData) {
        const value = getNestedValue(localeData[namespace], translationKey);
        if (value && typeof value === 'string') {
          results[key] = value;
        } else {
          results[key] = suggestTranslation(key, targetLocale);
        }
      } else {
        results[key] = key;
      }
    });
    
    return results;
  }, [suggestTranslation]);

  const exportTranslations = useCallback(async (locale: Locale, format: 'json' | 'csv' | 'xlsx'): Promise<Blob> => {
    const data = translationCache[locale] || {};
    
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      case 'csv':
        // CSV形式での出力
        let csv = 'Key,Translation\n';
        const flattenObject = (obj: any, prefix = ''): void => {
          Object.keys(obj).forEach(key => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              flattenObject(obj[key], fullKey);
            } else {
              csv += `"${fullKey}","${String(obj[key]).replace(/"/g, '""')}"\n`;
            }
          });
        };
        flattenObject(data);
        return new Blob([csv], { type: 'text/csv' });
      case 'xlsx':
        // 簡単なXLSX形式（実際のプロジェクトではSheetJSなどを使用）
        throw new Error('XLSX export not implemented yet');
      default:
        throw new Error('Unsupported format');
    }
  }, []);

  const importTranslations = useCallback(async (locale: Locale, data: File | string): Promise<void> => {
    let content: string;
    
    if (data instanceof File) {
      content = await data.text();
    } else {
      content = data;
    }
    
    try {
      const parsed = JSON.parse(content);
      Object.keys(parsed).forEach(namespace => {
        addTranslations(locale, namespace, parsed[namespace]);
      });
    } catch (error) {
      throw new Error('Invalid translation data format');
    }
  }, [addTranslations]);

  // 新機能: プラグインサポート
  const registerPlugin = useCallback((name: string, plugin: I18nPlugin) => {
    plugins[name] = plugin;
    plugin.initialize({} as AdvancedI18nContextType); // 型エラーを避けるため
  }, []);

  const unregisterPlugin = useCallback((name: string) => {
    if (plugins[name]) {
      plugins[name].destroy();
      delete plugins[name];
    }
  }, []);

  const getPlugins = useCallback(() => {
    return { ...plugins };
  }, []);

  const contextValue = useMemo(() => ({
    locale: currentLocale,
    setLocale,
    t,
    tn,
    availableLocales: ['ja', 'en', 'fr', 'de', 'ko', 'zh', 'ar', 'es', 'it', 'pt', 'ru', 'hi', 'th', 'vi', 'ms', 'tl'] as readonly Locale[],
    getLocaleInfo: (locale: Locale) => LOCALE_INFO[locale],
    formatDate,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
    formatList,
    formatUnit,
    isRTL: LOCALE_INFO[currentLocale].isRTL,
    getTextDirection: () => (LOCALE_INFO[currentLocale].isRTL ? 'rtl' : 'ltr'),
    preloadLocale,
    getTranslationStats,
    addTranslations,
    interpolate: interpolateString,
    hasTranslation: (key: string, locale?: Locale) => {
      const targetLocale = locale || currentLocale;
      const parts = key.split('.');
      const namespace = parts[0];
      const translationKey = parts.slice(1).join('.');
      const localeData = translationCache[targetLocale];
      return localeData && getNestedValue(localeData[namespace], translationKey) !== undefined;
    },
    getTranslationWithFallback,
    // 新機能
    detectLanguage,
    saveToMemory,
    searchMemory,
    bookmarkTranslation,
    getBookmarks,
    removeBookmark,
    startTranslationSession,
    endTranslationSession,
    getActiveSessions,
    validateTranslation,
    suggestTranslation,
    bulkTranslate,
    exportTranslations,
    importTranslations,
    registerPlugin,
    unregisterPlugin,
    getPlugins
  }), [
    currentLocale, t, tn, setLocale, formatDate, formatNumber, formatCurrency, 
    formatRelativeTime, formatList, formatUnit, preloadLocale, getTranslationStats, addTranslations,
    getTranslationWithFallback, detectLanguage, saveToMemory, searchMemory, bookmarkTranslation, getBookmarks, removeBookmark,
    startTranslationSession, endTranslationSession, getActiveSessions, validateTranslation, suggestTranslation,
    bulkTranslate, exportTranslations, importTranslations, registerPlugin, unregisterPlugin, getPlugins
  ]);

  return (
    <AdvancedI18nContext.Provider value={contextValue}>
      {children}
    </AdvancedI18nContext.Provider>
  );
}

export function useAdvancedI18n() {
  const context = useContext(AdvancedI18nContext);
  if (!context) {
    throw new Error('useAdvancedI18n must be used within an AdvancedI18nProvider');
  }
  return context;
}
