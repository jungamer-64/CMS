/**
 * Language Switcher Common Types
 * 言語切り替えコンポーネント共通型定義
 */

import type { Locale } from '../../contexts/advanced-i18n-context';

export interface LanguageSwitcherCommonProps {
  readonly locale: Locale;
  readonly availableLocales: readonly Locale[];
  readonly showProgress?: boolean;
  readonly showNativeNames?: boolean;
  readonly preloadOnHover?: boolean;
  readonly showBookmarks?: boolean;
  readonly bookmarkedLocales?: Set<Locale>;
  readonly getFlagEmoji: (locale: Locale) => string;
  readonly getProgress: (locale: Locale) => number | null;
  readonly handleLocaleChange: (locale: Locale) => Promise<void>;
  readonly handleMouseEnter: (locale: Locale) => Promise<void>;
  readonly getLocaleInfo: (locale: Locale) => {
    name: string;
    nativeName: string;
    isRTL: boolean;
    region?: string;
  };
  readonly getTextDirection: () => 'ltr' | 'rtl';
}

export interface AdvancedLanguageSwitcherProps {
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
