/**
 * Advanced i18n Types
 * 国際化コンテキスト用の型定義
 */

export type Locale = 'ja' | 'en' | 'fr' | 'de' | 'ko' | 'zh' | 'ar' | 'es' | 'it' | 'pt' | 'ru' | 'hi' | 'th' | 'vi' | 'ms' | 'tl';

export interface LocaleInfo {
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

export interface PluralRule {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export interface TranslationStats {
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  completionPercentage: number;
  lastUpdated?: Date;
  translationQuality?: number;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface LanguageDetection {
  detected: Locale;
  confidence: number;
  alternatives: Array<{ locale: Locale; confidence: number }>;
}

export interface TranslationMemory {
  source: string;
  target: string;
  locale: Locale;
  quality: number;
  lastUsed: Date;
}

export interface Bookmark {
  key: string;
  locale: Locale;
  note?: string;
  category?: string;
  createdAt: Date;
}

export interface TranslationSession {
  id: string;
  locale: Locale;
  startTime: Date;
  translatedKeys: string[];
  timeSpent: number;
  quality: number;
}

export interface I18nPlugin {
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

export interface AdvancedI18nContextType {
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
  formatList: (items: string[], options?: { style?: 'long' | 'short' | 'narrow'; type?: 'conjunction' | 'disjunction' | 'unit' }) => string;
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

export type TranslationData = Record<string, unknown>;
export type NamespaceTranslations = Record<string, TranslationData>;
