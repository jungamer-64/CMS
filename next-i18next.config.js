/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en', 'ko', 'zh', 'zh-TW', 'fr', 'de', 'ar', 'es', 'pt', 'it', 'ru', 'hi', 'th', 'vi'],
    localeDetection: true,
    domains: [
      {
        domain: 'example.com',
        defaultLocale: 'ja',
      },
      {
        domain: 'en.example.com',
        defaultLocale: 'en',
      },
      {
        domain: 'ko.example.com',
        defaultLocale: 'ko',
      },
    ],
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  fallbackLng: {
    default: ['ja', 'en'],
    en: ['ja'],
    ko: ['ja', 'en'],
    zh: ['ja', 'en'],
    'zh-TW': ['zh', 'ja', 'en'],
    fr: ['en', 'ja'],
    de: ['en', 'ja'],
    ar: ['en', 'ja'],
    es: ['en', 'ja'],
    pt: ['es', 'en', 'ja'],
    it: ['en', 'ja'],
    ru: ['en', 'ja'],
    hi: ['en', 'ja'],
    th: ['en', 'ja'],
    vi: ['en', 'ja'],
  },
  debug: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false, // React already escapes
    format: function(value, format, lng) {
      if (format === 'uppercase') return value.toUpperCase();
      if (format === 'lowercase') return value.toLowerCase();
      if (format === 'capitalize') return value.charAt(0).toUpperCase() + value.slice(1);
      
      // 数値フォーマット
      if (format === 'number' && typeof value === 'number') {
        return new Intl.NumberFormat(lng).format(value);
      }
      
      // 通貨フォーマット
      if (format === 'currency' && typeof value === 'number') {
        const currencyMap = {
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
        return new Intl.NumberFormat(lng, {
          style: 'currency',
          currency: currencyMap[lng] || 'USD'
        }).format(value);
      }
      
      // 日付フォーマット
      if (format === 'date' && value instanceof Date) {
        return new Intl.DateTimeFormat(lng).format(value);
      }
      
      if (format === 'datetime' && value instanceof Date) {
        return new Intl.DateTimeFormat(lng, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(value);
      }
      
      // 相対時間フォーマット
      if (format === 'relative' && value instanceof Date) {
        const rtf = new Intl.RelativeTimeFormat(lng, { numeric: 'auto' });
        const diff = value.getTime() - Date.now();
        const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (Math.abs(diffInDays) < 1) {
          const diffInHours = Math.floor(diff / (1000 * 60 * 60));
          return rtf.format(diffInHours, 'hour');
        }
        return rtf.format(diffInDays, 'day');
      }
      
      return value;
    },
    formatSeparator: ',',
    prefix: '{{',
    suffix: '}}',
  },
  react: {
    useSuspense: false,
    bindI18n: 'languageChanged',
    bindI18nStore: 'added removed',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span', 'a'],
  },
  ns: ['common', 'admin', 'auth', 'errors', 'validation', 'dates', 'numbers', 'forms', 'messages'],
  defaultNS: 'common',
  // 複数形処理の拡張
  pluralSeparator: '_',
  contextSeparator: '_',
  keySeparator: '.',
  nsSeparator: ':',
  // RTL言語の設定
  rtl: ['ar'],
  // 言語固有の設定
  resources: {},
  // 翻訳キーの検証
  saveMissing: process.env.NODE_ENV === 'development',
  missingKeyHandler: function(lng, ns, key, fallbackValue) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation key: ${lng}.${ns}.${key}`, fallbackValue || 'no fallback');
    }
  },
  // パフォーマンス最適化
  preload: ['ja', 'en'],
  cleanCode: true,
  lowerCaseLng: true,
  load: 'languageOnly',
  // バックエンド設定
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/{{lng}}/{{ns}}.missing.json',
  },
  // 翻訳の後処理
  postProcess: ['interval', 'plural'],
  // カスタムフォーマッター
  parseMissingKeyHandler: function(key) {
    return key.split('.').pop();
  },
}
