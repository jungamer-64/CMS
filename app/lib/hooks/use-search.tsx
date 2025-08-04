import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { JSX } from 'react';
import { 
  hasLogicalOperators, 
  filterItems, 
  getSearchHelpText, 
  getSearchPlaceholder,
  type SearchableItem,
  type SearchOptions,
  type SearchHelpItem
} from '../search-engine';

// より厳格な型定義（パフォーマンス向上）
export interface UseSearchOptions<T extends SearchableItem> extends SearchOptions {
  readonly searchFields?: readonly (keyof T)[];
  readonly debounceMs?: number;
  readonly enableCache?: boolean;
  readonly maxCacheSize?: number;
}

// 検索結果の型をより厳格に
export interface UseSearchResult<T extends SearchableItem> {
  readonly searchTerm: string;
  readonly setSearchTerm: (term: string) => void;
  readonly isRegexSearch: boolean;
  readonly setIsRegexSearch: (isRegex: boolean) => void;
  readonly filteredItems: readonly T[];
  readonly isLogicalSearch: boolean;
  readonly placeholder: string;
  readonly helpText: readonly SearchHelpItem[];
  readonly clearSearch: () => void;
  readonly isSearching: boolean;
  readonly searchStats: SearchStats;
}

// 検索統計の型
interface SearchStats {
  readonly total: number;
  readonly filtered: number;
  readonly percentage: number;
  readonly isFiltered: boolean;
  readonly searchTime?: number;
}

// 検索キャッシュエントリの型
interface CacheEntry<T> {
  readonly result: readonly T[];
  readonly timestamp: number;
}

// LRUキャッシュクラス（高速化）
class SearchLRUCache<T extends SearchableItem> {
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): readonly T[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // アクセス時にエントリを最新に移動（LRU）
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.result;
  }

  set(key: string, result: readonly T[]): void {
    // キャッシュサイズ制限
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * 検索機能を提供するReactフック（完全高速・型安全版）
 */
export function useSearch<T extends SearchableItem>(
  items: readonly T[],
  options: UseSearchOptions<T> = {}
): UseSearchResult<T> {
  const {
    debounceMs = 0,
    enableCache = true,
    maxCacheSize = 100,
    ...searchOptions
  } = options;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [isRegexSearch, setIsRegexSearch] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // キャッシュ参照（メモリリークを防ぐため）
  const cacheRef = useRef<SearchLRUCache<T> | null>(null);
  cacheRef.current ??= new SearchLRUCache<T>(maxCacheSize);

  // デバウンス処理（高速化）
  useEffect(() => {
    if (debounceMs === 0) {
      setDebouncedSearchTerm(searchTerm);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, debounceMs]);

  // 検索のクリア関数（useCallback使用でパフォーマンス向上）
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setIsRegexSearch(false);
    setIsSearching(false);
    if (enableCache && cacheRef.current) {
      cacheRef.current.clear();
    }
  }, [enableCache]);

  // 論理演算が使用されているかどうか（メモ化で高速化）
  const isLogicalSearch = useMemo(() => {
    return hasLogicalOperators(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // フィルタリングされたアイテム（型安全・高速化・キャッシュ対応）
  const { filteredItems, searchTime } = useMemo(() => {
    const startTime = performance.now();
    
    if (!debouncedSearchTerm) {
      return {
        filteredItems: items,
        searchTime: 0,
      };
    }

    // キャッシュキーを生成
    const cacheKey = enableCache 
      ? `${debouncedSearchTerm}:${isRegexSearch}:${JSON.stringify(searchOptions)}`
      : '';

    // キャッシュから取得を試行
    if (enableCache && cacheKey && cacheRef.current) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        return {
          filteredItems: cached,
          searchTime: performance.now() - startTime,
        };
      }
    }

    // 実際の検索実行
    const result = filterItems(items, debouncedSearchTerm, {
      ...searchOptions,
      isRegex: isRegexSearch,
    });

    const endTime = performance.now();

    // 結果をキャッシュ
    if (enableCache && cacheKey && cacheRef.current) {
      cacheRef.current.set(cacheKey, result);
    }

    return {
      filteredItems: result,
      searchTime: endTime - startTime,
    };
  }, [items, debouncedSearchTerm, searchOptions, isRegexSearch, enableCache]);

  // 検索統計（メモ化で高速化）
  const searchStats = useMemo<SearchStats>(() => {
    const total = items.length;
    const filtered = filteredItems.length;
    const percentage = total > 0 ? Math.round((filtered / total) * 100) : 0;

    return {
      total,
      filtered,
      percentage,
      isFiltered: filtered < total,
      searchTime: Math.round(searchTime * 100) / 100, // 小数点第2位まで
    };
  }, [items.length, filteredItems.length, searchTime]);

  // プレースホルダーテキスト（メモ化）
  const placeholder = useMemo(() => {
    return getSearchPlaceholder(debouncedSearchTerm, isRegexSearch);
  }, [debouncedSearchTerm, isRegexSearch]);

  // ヘルプテキスト（キャッシュされた値なのでメモ化不要）
  const helpText = getSearchHelpText();

  return {
    searchTerm,
    setSearchTerm,
    isRegexSearch,
    setIsRegexSearch,
    filteredItems,
    isLogicalSearch,
    placeholder,
    helpText,
    clearSearch,
    isSearching: isSearching || (debounceMs > 0 && searchTerm !== debouncedSearchTerm),
    searchStats,
  } as const;
}

/**
 * 検索インジケーターコンポーネント用のプロップス（厳格な型定義）
 */
export interface SearchIndicatorProps {
  readonly isLogicalSearch: boolean;
  readonly isRegexSearch: boolean;
  readonly className?: string;
}

/**
 * 検索モードを表示するインジケーターコンポーネント（高速化・型安全）
 */
export function SearchModeIndicator({ 
  isLogicalSearch, 
  isRegexSearch, 
  className = "" 
}: SearchIndicatorProps): JSX.Element | null {
  // 条件判定を最適化
  if (!isLogicalSearch && !isRegexSearch) return null;
  
  // スタイルクラスを事前計算（パフォーマンス向上）
  const baseClasses = "text-xs px-2 py-0.5 rounded";
  const modeClasses = isLogicalSearch 
    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
  
  const modeText = isLogicalSearch ? '論理演算' : '正規表現';
  
  return (
    <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${className}`}>
      <span className={`${baseClasses} ${modeClasses}`}>
        {modeText}
      </span>
    </div>
  );
}

/**
 * 検索ヘルプコンポーネント用のプロップス（厳格な型定義）
 */
export interface SearchHelpProps {
  readonly helpText: readonly SearchHelpItem[];
  readonly isVisible: boolean;
  readonly className?: string;
}

/**
 * 検索ヘルプを表示するコンポーネント（高速化・型安全）
 */
export function SearchHelp({ 
  helpText, 
  isVisible, 
  className = "" 
}: SearchHelpProps): JSX.Element | null {
  // 早期リターンでパフォーマンス向上
  if (!isVisible) return null;
  
  return (
    <div className={`text-xs text-gray-600 dark:text-gray-400 bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-800 ${className}`}>
      <div className="font-medium mb-1">論理演算の使い方：</div>
      <div className="space-y-1">
        {helpText.map((item) => (
          <div key={item.code} className="flex items-start gap-2">
            <code className="bg-white dark:bg-gray-800 px-1 rounded text-nowrap">
              {item.code}
            </code>
            <span className="flex-1">{item.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 検索状態管理のためのカスタムフック（高速化）
 */
export function useSearchState(initialTerm = '', initialRegex = false) {
  const [searchTerm, setSearchTerm] = useState(initialTerm);
  const [isRegexSearch, setIsRegexSearch] = useState(initialRegex);
  
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setIsRegexSearch(false);
  }, []);
  
  const toggleRegex = useCallback(() => {
    setIsRegexSearch(prev => !prev);
  }, []);
  
  return {
    searchTerm,
    setSearchTerm,
    isRegexSearch,
    setIsRegexSearch,
    clearSearch,
    toggleRegex,
  } as const;
}

/**
 * 検索結果の統計情報を計算するフック（メモ化で高速化）
 */
export function useSearchStats<T>(
  allItems: readonly T[],
  filteredItems: readonly T[]
) {
  return useMemo(() => {
    const total = allItems.length;
    const filtered = filteredItems.length;
    const percentage = total > 0 ? Math.round((filtered / total) * 100) : 0;
    
    return {
      total,
      filtered,
      percentage,
      isFiltered: filtered < total,
    } as const;
  }, [allItems.length, filteredItems.length]);
}

// デフォルトエクスポートも追加
export default useSearch;
