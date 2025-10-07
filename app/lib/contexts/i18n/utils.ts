/**
 * Advanced i18n Utilities
 * 国際化ユーティリティ関数
 */

import type { Locale, PluralRule, NamespaceTranslations } from './types';

// 翻訳データのキャッシュ
export const translationCache: Record<Locale, NamespaceTranslations> = {} as Record<Locale, NamespaceTranslations>;

// 言語検出用の簡単なヒューリスティック
export const languagePatterns: Record<Locale, RegExp[]> = {
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

/**
 * ネストしたオブジェクトから値を取得
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * 複数形ルールの選択
 */
export function selectPluralRule(count: number, locale: Locale): keyof PluralRule {
  const pluralRules = new Intl.PluralRules(locale);
  return pluralRules.select(count) as keyof PluralRule;
}

/**
 * 変数補間
 */
export function interpolateString(template: string, variables: Record<string, unknown>): string {
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

/**
 * 翻訳データを読み込む関数
 */
export async function loadTranslations(locale: Locale): Promise<NamespaceTranslations> {
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
