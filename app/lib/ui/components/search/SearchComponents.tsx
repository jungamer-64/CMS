import type { JSX } from 'react';
import { SearchModeIndicator, SearchHelp, type UseSearchResult } from '../../../hooks/use-search';
import type { SearchableItem } from '../../../search-engine';

export interface SearchInputProps<T extends SearchableItem> {
  readonly search: UseSearchResult<T>;
  readonly placeholder?: string;
  readonly className?: string;
}

/**
 * 検索入力フィールドコンポーネント
 */
export function SearchInput<T extends SearchableItem>({ search, placeholder, className }: Readonly<SearchInputProps<T>>): JSX.Element {
  return (
    <div className="flex-1 relative">
      <input
        type="text"
        placeholder={placeholder || search.placeholder}
        value={search.searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => search.setSearchTerm(e.target.value)}
        className={
          className || (() => {
            const baseClasses = 'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white';
            if (search.isLogicalSearch) return `${baseClasses} border-orange-300 dark:border-orange-600`;
            if (search.isRegexSearch) return `${baseClasses} border-purple-300 dark:border-purple-600`;
            return `${baseClasses} border-gray-300 dark:border-gray-600`;
          })()
        }
      />
      <SearchModeIndicator 
        isLogicalSearch={search.isLogicalSearch} 
        isRegexSearch={search.isRegexSearch} 
      />
    </div>
  );
}

export interface RegexToggleButtonProps<T extends SearchableItem> {
  readonly search: UseSearchResult<T>;
  readonly className?: string;
}

/**
 * 正規表現トグルボタンコンポーネント
 */
export function RegexToggleButton<T extends SearchableItem>({ search, className }: Readonly<RegexToggleButtonProps<T>>): JSX.Element {
  return (
    <button
      onClick={() => search.setIsRegexSearch(!search.isRegexSearch)}
      className={
        className || `px-3 py-2 border rounded-lg transition-colors ${
          search.isRegexSearch
            ? 'bg-purple-500 text-white border-purple-500 hover:bg-purple-600'
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
        }`
      }
      title={search.isRegexSearch ? '正規表現を無効にする' : '正規表現を有効にする'}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    </button>
  );
}

export interface SearchBarProps<T extends SearchableItem> {
  readonly search: UseSearchResult<T>;
  readonly placeholder?: string;
  readonly showRegexToggle?: boolean;
  readonly showHelp?: boolean;
  readonly className?: string;
}

/**
 * 完全な検索バーコンポーネント（入力フィールド + 正規表現トグル + ヘルプ）
 */
export function SearchBar<T extends SearchableItem>({ 
  search, 
  placeholder, 
  showRegexToggle = true, 
  showHelp = true,
  className 
}: Readonly<SearchBarProps<T>>): JSX.Element {
  return (
    <div className={className || "flex flex-col gap-4"}>
      {/* 検索入力行 */}
      <div className="flex gap-2">
        <SearchInput search={search} placeholder={placeholder} />
        {showRegexToggle && <RegexToggleButton search={search} />}
      </div>
      
      {/* 検索ヘルプ（論理演算の場合のみ表示） */}
      {showHelp && (
        <SearchHelp 
          helpText={search.helpText} 
          isVisible={search.isLogicalSearch} 
        />
      )}
    </div>
  );
}

export interface SearchStatsProps {
  readonly totalCount: number;
  readonly filteredCount: number;
  readonly selectedCount?: number;
  readonly className?: string;
}

/**
 * 検索統計表示コンポーネント
 */
export function SearchStats({ 
  totalCount, 
  filteredCount, 
  selectedCount,
  className 
}: Readonly<SearchStatsProps>): JSX.Element {
  return (
    <div className={className || "grid grid-cols-2 md:grid-cols-3 gap-4"}>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCount}</div>
        <div className="text-gray-600 dark:text-gray-400">総件数</div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{filteredCount}</div>
        <div className="text-gray-600 dark:text-gray-400">表示中</div>
      </div>
      {selectedCount !== undefined && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedCount}</div>
          <div className="text-gray-600 dark:text-gray-400">選択中</div>
        </div>
      )}
    </div>
  );
}

export interface EmptySearchResultsProps {
  readonly hasSearchTerm: boolean;
  readonly emptyMessage?: string;
  readonly noResultsMessage?: string;
  readonly className?: string;
}

/**
 * 検索結果が空の場合の表示コンポーネント
 */
export function EmptySearchResults({ 
  hasSearchTerm, 
  emptyMessage = 'アイテムがありません',
  noResultsMessage = '検索条件に一致するアイテムが見つかりません',
  className 
}: Readonly<EmptySearchResultsProps>): JSX.Element {
  return (
    <div className={className || "text-center py-12"}>
      <div className="text-gray-500 dark:text-gray-400">
        {hasSearchTerm ? noResultsMessage : emptyMessage}
      </div>
    </div>
  );
}
