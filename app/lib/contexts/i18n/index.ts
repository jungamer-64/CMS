/**
 * Advanced i18n Module Index
 * 国際化モジュールのエクスポート
 */

// 型定義
export type {
  Locale,
  LocaleInfo,
  PluralRule,
  TranslationStats,
  LanguageDetection,
  TranslationMemory,
  Bookmark,
  TranslationSession,
  I18nPlugin,
  AdvancedI18nContextType,
  TranslationData,
  NamespaceTranslations,
} from './types';

// ロケール設定
export { LOCALE_INFO, AVAILABLE_LOCALES } from './locale-config';

// ユーティリティ関数
export {
  translationCache,
  languagePatterns,
  getNestedValue,
  selectPluralRule,
  interpolateString,
  loadTranslations,
} from './utils';

// メインコンテキスト（元のファイルから再エクスポート）
export { AdvancedI18nProvider, useAdvancedI18n } from '../advanced-i18n-context';
