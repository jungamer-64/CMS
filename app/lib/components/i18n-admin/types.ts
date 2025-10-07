/**
 * I18n Admin Panel Common Types
 * I18n管理パネル共通型定義
 */

import type { Locale } from '../../contexts/advanced-i18n-context';

export interface TranslationMemory {
  source: string;
  target: string;
  locale: string;
  quality: number;
  lastUsed: Date;
}

export interface TranslationSession {
  id: string;
  locale: string;
  startTime: Date;
  translatedKeys: string[];
  timeSpent: number;
  quality: number;
}

export interface TranslationStats {
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  completionPercentage: number;
}

export interface I18nTabProps {
  readonly selectedLocale: Locale;
  readonly stats: TranslationStats;
}
