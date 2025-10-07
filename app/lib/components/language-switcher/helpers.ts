/**
 * Language Switcher Helper Functions
 * 言語切り替えコンポーネント共通ヘルパー関数
 */

import type { Locale } from '../../contexts/advanced-i18n-context';

/**
 * 言語フラグの絵文字を取得
 */
export function getFlagEmoji(localeCode: Locale): string {
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
}

/**
 * 完了率の色を取得
 */
export function getCompletionColor(percentage: number): string {
  if (percentage >= 90) return 'text-green-600';
  if (percentage >= 70) return 'text-yellow-600';
  return 'text-red-600';
}
