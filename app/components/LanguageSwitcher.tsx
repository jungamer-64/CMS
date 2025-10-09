'use client';

import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

const languages: Language[] = [
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
];

interface LanguageSwitcherProps {
  readonly variant?: 'dropdown' | 'compact' | 'full';
  readonly showFlag?: boolean;
  readonly showNativeName?: boolean;
  readonly className?: string;
  readonly onLanguageChange?: (language: string) => void;
}

function LanguageSwitcher({
  variant = 'dropdown',
  showFlag = true,
  showNativeName = true,
  className = '',
  onLanguageChange,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right' | 'center'>('center');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // currentLanguageをuseMemoで最適化
  const currentLanguage = useMemo(
    () => languages.find(lang => lang.code === i18n.language) || languages[0],
    [i18n.language]
  );
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const adjustDropdownPosition = () => {
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const dropdownWidth = 320; // w-80 = 320px固定
        const margin = 32; // より大きなマージンを設定
        
        // 画面の右半分にある場合は右寄せ
        if (rect.left > viewportWidth / 2) {
          setDropdownPosition('right');
        }
        // 右端チェック：ドロップダウンが画面右端を超える場合も右寄せ
        else if (rect.left + dropdownWidth > viewportWidth - margin) {
          setDropdownPosition('right');
        } 
        // 左端チェック：ドロップダウンが画面左端を超える場合は左寄せ
        else if (rect.right - dropdownWidth < margin) {
          setDropdownPosition('left');
        } 
        // デフォルトは右寄せ
        else {
          setDropdownPosition('right');
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', adjustDropdownPosition);
    adjustDropdownPosition();
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', adjustDropdownPosition);
    };
  }, [variant]);
  
  // handleLanguageChangeをuseCallbackで最適化
  const handleLanguageChange = useCallback(async (languageCode: string) => {
    const selectedLanguage = languages.find(lang => lang.code === languageCode);
    if (!selectedLanguage) return;
    
    // RTL言語の場合はbody要素にdir属性を設定
    if (selectedLanguage.rtl) {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = languageCode;
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = languageCode;
    }
    
    // ルーターで言語を変更
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: languageCode });
    
    setIsOpen(false);
    onLanguageChange?.(languageCode);
  }, [router, onLanguageChange]);
  
  const getDropdownPositionClass = () => {
    // ナビゲーションバーの右端にある場合は常に右寄せ
    if (dropdownPosition === 'right') return 'right-0';
    if (dropdownPosition === 'left') return 'left-0';
    return 'right-0'; // デフォルトも右寄せに変更
  };
  
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1 px-2 py-1 rounded-md border bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors language-button-hover"
          aria-label={t('ui.languageSelector')}
        >
          {showFlag && <span className="text-lg">{currentLanguage.flag}</span>}
          <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div className={`absolute top-full mt-1 w-80 min-w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto language-selector-scroll ${getDropdownPositionClass()}`}>
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 language-button-hover ${
                    currentLanguage.code === language.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                  }`}
                >
                  {showFlag && <span className="text-base">{language.flag}</span>}
                  <div className="flex-1">
                    <div className="font-medium">{showNativeName ? language.nativeName : language.name}</div>
                    {showNativeName && language.nativeName !== language.name && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{language.name}</div>
                    )}
                  </div>
                  {currentLanguage.code === language.code && (
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  if (variant === 'full') {
    return (
      <div className={`grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 ${className}`}>
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
              currentLanguage.code === language.code
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            aria-label={`Switch to ${language.name}`}
          >
            <div className="flex items-center space-x-3">
              {showFlag && <span className="text-2xl">{language.flag}</span>}
              <div className="text-left">
                <div className="font-medium text-sm">{showNativeName ? language.nativeName : language.name}</div>
                {showNativeName && language.nativeName !== language.name && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">{language.name}</div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }
  
  // デフォルトのドロップダウン
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors language-button-hover"
        aria-label={t('ui.languageSelector')}
      >
        {showFlag && <span className="text-lg">{currentLanguage.flag}</span>}
        <span>{showNativeName ? currentLanguage.nativeName : currentLanguage.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className={`absolute top-full mt-1 w-80 min-w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto language-selector-scroll ${getDropdownPositionClass()}`}>
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 language-button-hover ${
                  currentLanguage.code === language.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                {showFlag && <span className="text-base">{language.flag}</span>}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{showNativeName ? language.nativeName : language.name}</div>
                  {showNativeName && language.nativeName !== language.name && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{language.name}</div>
                  )}
                </div>
                {currentLanguage.code === language.code && (
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Props比較関数 - variantとshowFlagなどのprimitiveな値を比較
const arePropsEqual = (
  prevProps: LanguageSwitcherProps,
  nextProps: LanguageSwitcherProps
): boolean => {
  return (
    prevProps.variant === nextProps.variant &&
    prevProps.showFlag === nextProps.showFlag &&
    prevProps.showNativeName === nextProps.showNativeName &&
    prevProps.className === nextProps.className &&
    prevProps.onLanguageChange === nextProps.onLanguageChange
  );
};

// React.memoで最適化 - props変更時のみ再レンダリング
export default memo(LanguageSwitcher, arePropsEqual);
