'use client';

import { useState, useCallback, useMemo } from 'react';
import { useExtendedTranslation } from '../lib/hooks/useExtendedTranslation';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  url: string;
  language: string;
  relevance: number;
}

interface MultilingualSearchProps {
  readonly onSearch?: (query: string, results: SearchResult[]) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly languages?: string[];
  readonly searchInAllLanguages?: boolean;
}

/**
 * 多言語対応検索コンポーネント
 * 複数言語での検索、言語固有の検索、音素変換などを提供
 */
export default function MultilingualSearch({
  onSearch,
  placeholder,
  className = '',
  languages = ['ja', 'en'],
  searchInAllLanguages = true,
}: MultilingualSearchProps) {
  const { t, locale, formatList } = useExtendedTranslation('common');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(searchInAllLanguages ? languages : [locale]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  // 音素変換マップ（ひらがな・カタカナ・ローマ字対応）
  const phonemeMap = useMemo(() => ({
    // ひらがな → カタカナ
    hiraganaToKatakana: (text: string) => 
      text.replace(/[\u3041-\u3096]/g, char => 
        String.fromCharCode(char.charCodeAt(0) + 0x60)
      ),
    
    // カタカナ → ひらがな
    katakanaToHiragana: (text: string) => 
      text.replace(/[\u30A1-\u30F6]/g, char => 
        String.fromCharCode(char.charCodeAt(0) - 0x60)
      ),
    
    // 基本的なローマ字変換パターン
    romajiPatterns: {
      'a': 'あア', 'i': 'いイ', 'u': 'うウ', 'e': 'えエ', 'o': 'おオ',
      'ka': 'かカ', 'ki': 'きキ', 'ku': 'くク', 'ke': 'けケ', 'ko': 'こコ',
      'ga': 'がガ', 'gi': 'ぎギ', 'gu': 'ぐグ', 'ge': 'げゲ', 'go': 'ごゴ',
      'sa': 'さサ', 'shi': 'しシ', 'su': 'すス', 'se': 'せセ', 'so': 'そソ',
      'za': 'ざザ', 'ji': 'じジ', 'zu': 'ずズ', 'ze': 'ぜゼ', 'zo': 'ぞゾ',
      'ta': 'たタ', 'chi': 'ちチ', 'tsu': 'つツ', 'te': 'てテ', 'to': 'とト',
      'da': 'だダ', 'di': 'ぢヂ', 'du': 'づヅ', 'de': 'でデ', 'do': 'どド',
      'na': 'なナ', 'ni': 'にニ', 'nu': 'ぬヌ', 'ne': 'ねネ', 'no': 'のノ',
      'ha': 'はハ', 'hi': 'ひヒ', 'fu': 'ふフ', 'he': 'へヘ', 'ho': 'ほホ',
      'ba': 'ばバ', 'bi': 'びビ', 'bu': 'ぶブ', 'be': 'べベ', 'bo': 'ぼボ',
      'pa': 'ぱパ', 'pi': 'ぴピ', 'pu': 'ぷプ', 'pe': 'ぺペ', 'po': 'ぽポ',
      'ma': 'まマ', 'mi': 'みミ', 'mu': 'むム', 'me': 'めメ', 'mo': 'もモ',
      'ya': 'やヤ', 'yu': 'ゆユ', 'yo': 'よヨ',
      'ra': 'らラ', 'ri': 'りリ', 'ru': 'るル', 're': 'れレ', 'ro': 'ろロ',
      'wa': 'わワ', 'wo': 'をヲ', 'n': 'んン',
    },
  }), []);
  
  // 検索クエリを正規化（音素変換含む）
  const normalizeQuery = useCallback((searchQuery: string, targetLanguage: string) => {
    const normalized = searchQuery.toLowerCase().trim();
    
    if (targetLanguage === 'ja') {
      // 日本語の場合、ひらがな・カタカナ・ローマ字の相互変換
      const variants = [
        normalized,
        phonemeMap.hiraganaToKatakana(normalized),
        phonemeMap.katakanaToHiragana(normalized),
      ];
      
      // ローマ字からの変換
      Object.entries(phonemeMap.romajiPatterns).forEach(([romaji, kana]) => {
        if (normalized.includes(romaji)) {
          kana.split('').forEach(char => variants.push(char));
        }
      });
      
      return variants.filter((v, i, arr) => arr.indexOf(v) === i); // 重複除去
    }
    
    if (targetLanguage === 'en') {
      // 英語の場合、単複形、時制変化などの基本的な正規化
      const variants = [normalized];
      
      // 基本的な単複形変換
      if (normalized.endsWith('s') && normalized.length > 2) {
        variants.push(normalized.slice(0, -1));
      } else {
        variants.push(normalized + 's');
      }
      
      // 基本的な時制変換
      if (normalized.endsWith('ing')) {
        variants.push(normalized.slice(0, -3));
      }
      if (normalized.endsWith('ed')) {
        variants.push(normalized.slice(0, -2));
      }
      
      return variants.filter((v, i, arr) => arr.indexOf(v) === i);
    }
    
    return [normalized];
  }, [phonemeMap]);
  
  // 模擬検索関数（実際の実装では API を呼び出す）
  const performSearch = useCallback(async (searchQuery: string, targetLanguages: string[]): Promise<SearchResult[]> => {
    // 実際の実装ではここで API コールを行う
    const mockResults: SearchResult[] = [];
    
    for (const lang of targetLanguages) {
      const normalizedQueries = normalizeQuery(searchQuery, lang);
      
      // 模擬検索結果
      normalizedQueries.forEach((normalizedQuery, index) => {
        if (normalizedQuery.length > 0) {
          mockResults.push({
            id: `${lang}-${index}-${Date.now()}`,
            title: `${t('search.result')} "${normalizedQuery}" (${lang})`,
            content: `${t('search.mockContent')} ${normalizedQuery}`,
            url: `/search?q=${encodeURIComponent(normalizedQuery)}&lang=${lang}`,
            language: lang,
            relevance: 1 - (index * 0.1),
          });
        }
      });
    }
    
    // 関連度でソート
    return mockResults.sort((a, b) => b.relevance - a.relevance);
  }, [normalizeQuery, t]);
  
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const results = await performSearch(searchQuery, selectedLanguages);
      setSearchResults(results);
      onSearch?.(searchQuery, results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [selectedLanguages, performSearch, onSearch]);
  
  const toggleLanguage = useCallback((languageCode: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(languageCode)) {
        return prev.filter(lang => lang !== languageCode);
      } else {
        return [...prev, languageCode];
      }
    });
  }, []);
  
  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* 検索入力 */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder={placeholder || t('search.placeholder')}
          className="w-full px-4 py-3 pr-12 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {isSearching ? (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}
      </div>
      
      {/* 言語選択 */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400 py-1">
          {t('search.searchIn')}:
        </span>
        {languages.map((languageCode) => (
          <button
            key={languageCode}
            onClick={() => toggleLanguage(languageCode)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              selectedLanguages.includes(languageCode)
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {languageCode.toUpperCase()}
          </button>
        ))}
      </div>
      
      {/* 検索統計 */}
      {searchResults.length > 0 && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {t('search.foundResults', { 
            count: searchResults.length,
            languages: formatList(selectedLanguages.map(lang => lang.toUpperCase())),
          })}
        </div>
      )}
      
      {/* 検索結果 */}
      {searchResults.length > 0 && (
        <div className="mt-4 space-y-3">
          {searchResults.slice(0, 10).map((result) => (
            <div
              key={result.id}
              className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                <a href={result.url}>{result.title}</a>
              </h3>
              <p className="mt-1 text-gray-600 dark:text-gray-300 line-clamp-2">
                {result.content}
              </p>
              <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {result.language.toUpperCase()}
                </span>
                <span>•</span>
                <span>{t('search.relevance')}: {Math.round(result.relevance * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 検索結果なし */}
      {query && !isSearching && searchResults.length === 0 && (
        <div className="mt-4 p-4 text-center text-gray-500 dark:text-gray-400">
          {t('search.noResults', { query })}
        </div>
      )}
    </div>
  );
}
