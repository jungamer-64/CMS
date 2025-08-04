import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

type DateStyle = 'short' | 'medium' | 'long' | 'full';
type TimeStyle = 'short' | 'medium' | 'long' | 'full';
type Gender = 'male' | 'female' | 'other';
type TranslationOptions = Record<string, string | number | boolean | null | undefined>;

/**
 * 拡張されたi18nフック
 * 日付、数値、通貨、相対時間などの高度なフォーマット機能を提供
 */
export function useExtendedTranslation(namespace?: string) {
  const { t, i18n } = useTranslation(namespace);
  
  const formatters = useMemo(() => {
    const locale = i18n.language;
    
    return {
      // 数値フォーマッター
      number: new Intl.NumberFormat(locale),
      
      // 通貨フォーマッター
      currency: (currencyCode?: string) => {
        const currencies = {
          'ja': 'JPY',
          'en': 'USD',
          'ko': 'KRW',
          'zh': 'CNY',
          'zh-TW': 'TWD',
          'fr': 'EUR',
          'de': 'EUR',
          'ar': 'USD',
          'es': 'EUR',
          'pt': 'EUR',
          'it': 'EUR',
          'ru': 'RUB',
          'hi': 'INR',
          'th': 'THB',
          'vi': 'VND',
        };
        const currency = currencyCode || currencies[locale as keyof typeof currencies] || 'USD';
        return new Intl.NumberFormat(locale, { style: 'currency', currency });
      },
      
      // パーセンテージフォーマッター
      percent: new Intl.NumberFormat(locale, { style: 'percent' }),
      
      // 日付フォーマッター
      date: (options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, options),
      
      // 相対時間フォーマッター
      relativeTime: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
      
      // リストフォーマッター
      list: (type: 'conjunction' | 'disjunction' = 'conjunction') => 
        new Intl.ListFormat(locale, { style: 'long', type }),
    };
  }, [i18n.language]);
  
  // 拡張されたフォーマット関数
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(i18n.language, options).format(value);
  };
  
  const formatCurrency = (value: number, currencyCode?: string) => {
    return formatters.currency(currencyCode).format(value);
  };
  
  const formatPercent = (value: number) => {
    return formatters.percent.format(value);
  };
  
  const formatDate = (date: Date, style: DateStyle = 'medium') => {
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: style,
    };
    
    return formatters.date(options).format(date);
  };
  
  const formatDateTime = (date: Date, dateStyle?: DateStyle, timeStyle?: TimeStyle) => {
    return formatters.date({ dateStyle, timeStyle }).format(date);
  };
  
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
    
    const intervals = [
      { unit: 'year' as Intl.RelativeTimeFormatUnit, seconds: 31536000 },
      { unit: 'month' as Intl.RelativeTimeFormatUnit, seconds: 2628000 },
      { unit: 'week' as Intl.RelativeTimeFormatUnit, seconds: 604800 },
      { unit: 'day' as Intl.RelativeTimeFormatUnit, seconds: 86400 },
      { unit: 'hour' as Intl.RelativeTimeFormatUnit, seconds: 3600 },
      { unit: 'minute' as Intl.RelativeTimeFormatUnit, seconds: 60 },
      { unit: 'second' as Intl.RelativeTimeFormatUnit, seconds: 1 },
    ];
    
    for (const interval of intervals) {
      const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
      if (count >= 1) {
        return formatters.relativeTime.format(
          diffInSeconds < 0 ? -count : count,
          interval.unit
        );
      }
    }
    
    return formatters.relativeTime.format(0, 'second');
  };
  
  const formatList = (items: string[], type: 'conjunction' | 'disjunction' = 'conjunction') => {
    return formatters.list(type).format(items);
  };
  
  // ファイルサイズフォーマッター
  const formatFileSize = (bytes: number, decimals: number = 2) => {
    if (bytes === 0) return '0 ' + t('numbers:units.byte');
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
    
    return formatNumber(value) + ' ' + t(`numbers:units.${sizes[i]}`);
  };
  
  // 複数形対応の翻訳
  const tPlural = (key: string, count: number, options?: TranslationOptions) => {
    return t(key, { count, ...options });
  };
  
  // 性別対応の翻訳（日本語では通常不要だが、他言語対応のため）
  const tGender = (key: string, gender: Gender, options?: TranslationOptions) => {
    const genderKey = `${key}_${gender}`;
    const fallbackKey = key;
    
    // 性別固有のキーが存在するかチェック
    const translation = t(genderKey, { ...options, defaultValue: null });
    if (translation) return translation;
    
    return t(fallbackKey, options);
  };
  
  // コンテキスト対応の翻訳
  const tContext = (key: string, context: string, options?: TranslationOptions) => {
    const contextKey = `${key}_${context}`;
    const fallbackKey = key;
    
    const translation = t(contextKey, { ...options, defaultValue: null });
    if (translation) return translation;
    
    return t(fallbackKey, options);
  };
  
  return {
    t,
    i18n,
    formatNumber,
    formatCurrency,
    formatPercent,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    formatList,
    formatFileSize,
    tPlural,
    tGender,
    tContext,
    formatters,
    locale: i18n.language,
    isRTL: i18n.dir() === 'rtl',
  };
}
