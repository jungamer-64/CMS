/**
 * Compact Language Switcher Component
 * コンパクト形式の言語切り替えコンポーネント
 */

'use client';

import React from 'react';

import type { Locale } from '../../contexts/advanced-i18n-context';

interface CompactLanguageSwitcherProps {
  readonly locale: Locale;
  readonly availableLocales: readonly Locale[];
  readonly className?: string;
  readonly getFlagEmoji: (locale: Locale) => string;
  readonly getTextDirection: () => 'ltr' | 'rtl';
  readonly handleLocaleChange: (locale: Locale) => Promise<void>;
}

export function CompactLanguageSwitcher({
  locale,
  availableLocales,
  className = '',
  getFlagEmoji,
  getTextDirection,
  handleLocaleChange
}: CompactLanguageSwitcherProps) {
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
