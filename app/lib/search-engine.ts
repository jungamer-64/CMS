/**
 * 高度な検索エンジン（完全リファクタリング版）
 * 論理演算、ワイルドカード、日付フィルター、完全一致、ファイルタイプ検索をサポート
 * 最高速度と厳格な型安全性を実現
 */

// 基本的な検索対象フィールド型（より柔軟に）
export interface SearchableItem {
  readonly uploadDate?: string | Date;
  readonly filename?: string;
  readonly author?: string;
  readonly title?: string;
  readonly content?: string;
  readonly [key: string]: unknown;
}

// 検索オプションをより厳格に型定義
export interface SearchOptions {
  readonly isRegex?: boolean;
  readonly caseSensitive?: boolean;
  readonly dateField?: string;
  readonly filenameField?: string;
  readonly authorField?: string;
  readonly titleField?: string;
  readonly contentField?: string;
  readonly maxResults?: number;
}

// 日付範囲検索のための型
export interface DateRange {
  readonly after?: Date;
  readonly before?: Date;
}

// 検索演算子を列挙型で定義
export const enum SearchOperator {
  AND = '&',
  OR = '|',
  NOT = '!',
}

// 検索フィルタータイプを列挙型で定義
export const enum FilterType {
  FILETYPE = 'filetype:',
  AUTHOR = 'author:',
  TITLE = 'title:',
  CONTENT = 'content:',
  BEFORE = 'before:',
  AFTER = 'after:',
}

// 正規化された検索コンテキスト（高速化のため事前計算）
interface NormalizedSearchContext {
  readonly filename: string;
  readonly normalizedFilename: string;
  readonly uploadDate?: Date;
  readonly author?: string;
  readonly normalizedAuthor?: string;
  readonly title?: string;
  readonly normalizedTitle?: string;
  readonly content?: string;
  readonly normalizedContent?: string;
  readonly fileExtension?: string;
}

// 検索クエリパーサー結果の型
interface ParsedSearchQuery {
  readonly terms: readonly string[];
  readonly andTerms: readonly string[];
  readonly orTerms: readonly string[];
  readonly notTerms: readonly string[];
  readonly exactMatches: readonly string[];
  readonly wildcards: readonly string[];
  readonly filters: SearchFilters;
  readonly dateRange: DateRange;
}

// 検索フィルター型
interface SearchFilters {
  readonly filetype?: string;
  readonly author?: string;
  readonly title?: string;
  readonly content?: string;
}

// 高速化のために正規表現をコンパイル時に作成
const COMPILED_REGEX = Object.freeze({
  andOperator: /\s*&+\s*/g,
  orOperator: /\s*\|\s*/g,
  notOperator: /!\s*/g,
  quotedTerms: /"([^"]*)"/g,
  wildcardPattern: /[*?]/g,
  parentheses: /[()]/g,
  whitespace: /\s+/g,
  filterPatterns: {
    filetype: /\bfiletype:([^\s&|!()]+)/gi,
    author: /\bauthor:([^\s&|!()]+)/gi,
    title: /\btitle:([^\s&|!()]+)/gi,
    content: /\bcontent:([^\s&|!()]+)/gi,
    before: /\bbefore:([\d-/]+)/gi,
    after: /\bafter:([\d-/]+)/gi,
  },
  dateFormat: /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
} as const);

// メモ化キャッシュ（WeakMapを使用してメモリリークを防止）
const normalizationCache = new WeakMap<SearchableItem, NormalizedSearchContext>();
const queryCache = new Map<string, ParsedSearchQuery>();

// 文字列正規化関数（高速化）
function normalizeString(str: string | undefined | null): string {
  return str?.toLowerCase().trim() ?? '';
}

// 安全な文字列変換（型ガード付き）
function toSafeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  if (value instanceof Date) return value.toISOString();
  return '';
}

// 日付パースの高速化（事前コンパイル済み正規表現使用）
function parseDate(dateStr: string): Date | null {
  const match = COMPILED_REGEX.dateFormat.exec(dateStr);
  if (!match) return null;
  
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // 0ベース
  const day = parseInt(match[3], 10);
  
  const date = new Date(year, month, day);
  
  // 有効性チェック
  if (date.getFullYear() !== year || 
      date.getMonth() !== month || 
      date.getDate() !== day) {
    return null;
  }
  
  return date;
}

// ファイル拡張子抽出（高速化）
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.slice(lastDot + 1).toLowerCase() : '';
}

// アップロード日の安全な変換
function parseUploadDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return parseDate(value) ?? undefined;
  return undefined;
}

// 正規化されたコンテキストを作成（メモ化あり）
function createNormalizedContext(item: SearchableItem, options: SearchOptions): NormalizedSearchContext {
  const cached = normalizationCache.get(item);
  if (cached) return cached;
  
  const filename = toSafeString(item[options.filenameField ?? 'filename']);
  const uploadDate = parseUploadDate(item[options.dateField ?? 'uploadDate']);
  
  const context: NormalizedSearchContext = {
    filename,
    normalizedFilename: normalizeString(filename),
    uploadDate,
    author: toSafeString(item[options.authorField ?? 'author']),
    normalizedAuthor: normalizeString(toSafeString(item[options.authorField ?? 'author'])),
    title: toSafeString(item[options.titleField ?? 'title']),
    normalizedTitle: normalizeString(toSafeString(item[options.titleField ?? 'title'])),
    content: toSafeString(item[options.contentField ?? 'content']),
    normalizedContent: normalizeString(toSafeString(item[options.contentField ?? 'content'])),
    fileExtension: getFileExtension(filename),
  };
  
  normalizationCache.set(item, context);
  return context;
}

// 検索クエリをパース（メモ化あり）
function parseSearchQuery(searchTerm: string): ParsedSearchQuery {
  const cached = queryCache.get(searchTerm);
  if (cached) return cached;
  
  let processedQuery = searchTerm;
  const exactMatches: string[] = [];
  
  // 可変オブジェクトを作成
  const tempFilters: Record<string, string> = {};
  const tempDateRange: Record<string, Date> = {};
  
  // 引用符での完全一致を抽出
  processedQuery = processedQuery.replace(COMPILED_REGEX.quotedTerms, (match, content) => {
    exactMatches.push(content.trim());
    return '';
  });
  
  // フィルターを抽出
  processedQuery = processedQuery.replace(COMPILED_REGEX.filterPatterns.filetype, (match, value) => {
    tempFilters.filetype = value.toLowerCase();
    return '';
  });
  
  processedQuery = processedQuery.replace(COMPILED_REGEX.filterPatterns.author, (match, value) => {
    tempFilters.author = value;
    return '';
  });
  
  processedQuery = processedQuery.replace(COMPILED_REGEX.filterPatterns.title, (match, value) => {
    tempFilters.title = value;
    return '';
  });
  
  processedQuery = processedQuery.replace(COMPILED_REGEX.filterPatterns.content, (match, value) => {
    tempFilters.content = value;
    return '';
  });
  
  processedQuery = processedQuery.replace(COMPILED_REGEX.filterPatterns.before, (match, value) => {
    const date = parseDate(value);
    if (date) tempDateRange.before = date;
    return '';
  });
  
  processedQuery = processedQuery.replace(COMPILED_REGEX.filterPatterns.after, (match, value) => {
    const date = parseDate(value);
    if (date) tempDateRange.after = date;
    return '';
  });
  
  // 残りのクエリを分解
  const andTerms = processedQuery.split(COMPILED_REGEX.andOperator).map(t => t.trim()).filter(Boolean);
  const orTerms = processedQuery.split(COMPILED_REGEX.orOperator).map(t => t.trim()).filter(Boolean);
  const notTerms: string[] = [];
  const wildcards: string[] = [];
  const terms: string[] = [];
  
  // 各項目を分類
  [...andTerms, ...orTerms].forEach(term => {
    const cleanTerm = term.replace(COMPILED_REGEX.notOperator, '');
    if (term.startsWith('!')) {
      notTerms.push(cleanTerm);
    } else if (COMPILED_REGEX.wildcardPattern.test(term)) {
      wildcards.push(term);
    } else {
      terms.push(term);
    }
  });
  
  const parsed: ParsedSearchQuery = {
    terms,
    andTerms,
    orTerms,
    notTerms,
    exactMatches,
    wildcards,
    filters: Object.freeze({
      filetype: tempFilters.filetype,
      author: tempFilters.author,
      title: tempFilters.title,
      content: tempFilters.content,
    } as SearchFilters),
    dateRange: Object.freeze({
      before: tempDateRange.before,
      after: tempDateRange.after,
    } as DateRange),
  };
  
  queryCache.set(searchTerm, parsed);
  return parsed;
}

// ワイルドカードマッチング（高速化）
function matchesWildcard(text: string, pattern: string): boolean {
  const escapedPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
    
  try {
    const regex = new RegExp(`^${escapedPattern}$`, 'i');
    return regex.test(text);
  } catch {
    return text.toLowerCase().includes(pattern.toLowerCase().replace(/[*?]/g, ''));
  }
}

// 日付範囲マッチング（複雑性軽減）
function matchesDateRange(context: NormalizedSearchContext, dateRange: DateRange): boolean {
  if (!context.uploadDate) return true;
  
  if (dateRange.before && context.uploadDate > dateRange.before) return false;
  if (dateRange.after && context.uploadDate < dateRange.after) return false;
  
  return true;
}

// フィルターマッチング（複雑性軽減）
function matchesFilters(context: NormalizedSearchContext, filters: SearchFilters): boolean {
  if (filters.filetype && context.fileExtension !== filters.filetype) return false;
  if (filters.author && !context.normalizedAuthor?.includes(filters.author.toLowerCase())) return false;
  if (filters.title && !context.normalizedTitle?.includes(filters.title.toLowerCase())) return false;
  if (filters.content && !context.normalizedContent?.includes(filters.content.toLowerCase())) return false;
  
  return true;
}

// テキストマッチング（複雑性軽減）
function matchesTextQueries(searchableText: string, query: ParsedSearchQuery): boolean {
  // 完全一致チェック
  for (const exact of query.exactMatches) {
    if (!searchableText.includes(exact.toLowerCase())) return false;
  }
  
  // ワイルドカードチェック
  for (const wildcard of query.wildcards) {
    if (!matchesWildcard(searchableText, wildcard)) return false;
  }
  
  // NOT項目チェック
  for (const notTerm of query.notTerms) {
    if (searchableText.includes(notTerm.toLowerCase())) return false;
  }
  
  return true;
}

// 論理演算チェック（複雑性軽減）
function matchesLogicalQueries(searchableText: string, query: ParsedSearchQuery): boolean {
  // AND演算のチェック
  if (query.andTerms.length > 1) {
    return query.andTerms.every(term => searchableText.includes(term.toLowerCase()));
  }
  
  // OR演算のチェック
  if (query.orTerms.length > 1) {
    return query.orTerms.some(term => searchableText.includes(term.toLowerCase()));
  }
  
  // 通常の検索項目
  if (query.terms.length > 0) {
    return query.terms.some(term => searchableText.includes(term.toLowerCase()));
  }
  
  return true;
}

// メイン検索関数（複雑性を大幅軽減）
function matchesSearchQuery(context: NormalizedSearchContext, query: ParsedSearchQuery): boolean {
  // 日付範囲チェック
  if (!matchesDateRange(context, query.dateRange)) return false;
  
  // フィルターチェック
  if (!matchesFilters(context, query.filters)) return false;
  
  // すべての検索可能テキストを結合
  const searchableText = [
    context.normalizedFilename,
    context.normalizedAuthor,
    context.normalizedTitle,
    context.normalizedContent,
  ].filter(Boolean).join(' ');
  
  // テキストクエリチェック
  if (!matchesTextQueries(searchableText, query)) return false;
  
  // 論理演算チェック
  return matchesLogicalQueries(searchableText, query);
}

// 論理演算子検知（高速化版）
export function hasLogicalOperators(searchTerm: string): boolean {
  if (!searchTerm || typeof searchTerm !== 'string') return false;
  
  return (
    COMPILED_REGEX.andOperator.test(searchTerm) ||
    COMPILED_REGEX.orOperator.test(searchTerm) ||
    COMPILED_REGEX.notOperator.test(searchTerm) ||
    COMPILED_REGEX.quotedTerms.test(searchTerm) ||
    COMPILED_REGEX.wildcardPattern.test(searchTerm) ||
    COMPILED_REGEX.filterPatterns.filetype.test(searchTerm) ||
    COMPILED_REGEX.filterPatterns.author.test(searchTerm) ||
    COMPILED_REGEX.filterPatterns.title.test(searchTerm) ||
    COMPILED_REGEX.filterPatterns.content.test(searchTerm) ||
    COMPILED_REGEX.filterPatterns.before.test(searchTerm) ||
    COMPILED_REGEX.filterPatterns.after.test(searchTerm)
  );
}

// メインのフィルタリング関数（高速・型安全版）
export function filterItems<T extends SearchableItem>(
  items: readonly T[],
  searchTerm: string,
  options: SearchOptions = {}
): T[] {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return [...items];
  }
  
  const query = parseSearchQuery(searchTerm);
  const maxResults = options.maxResults ?? items.length;
  const results: T[] = [];
  
  for (let i = 0; i < items.length && results.length < maxResults; i++) {
    const item = items[i];
    const context = createNormalizedContext(item, options);
    
    if (matchesSearchQuery(context, query)) {
      results.push(item);
    }
  }
  
  return results;
}

// 検索ヘルプアイテムの型定義
export interface SearchHelpItem {
  readonly operator: string;
  readonly description: string;
  readonly example: string;
  // 後方互換性のため
  readonly code: string;
}

// 検索ヘルプテキスト（不変オブジェクト）
const SEARCH_HELP_ITEMS: readonly SearchHelpItem[] = Object.freeze([
  { operator: '&', description: 'AND演算（両方の条件が必要）', example: 'cat & dog', code: '&' },
  { operator: '|', description: 'OR演算（いずれかの条件が必要）', example: 'cat | dog', code: '|' },
  { operator: '!', description: 'NOT演算（条件を除外）', example: '!cat', code: '!' },
  { operator: '"検索語"', description: '完全一致検索', example: '"exact phrase"', code: '"検索語"' },
  { operator: '*', description: 'ワイルドカード検索', example: 'cat*', code: '*' },
  { operator: 'author:', description: '著者名で検索', example: 'author:john', code: 'author:名前' },
  { operator: 'title:', description: 'タイトルで検索', example: 'title:tutorial', code: 'title:タイトル' },
  { operator: 'content:', description: '内容で検索', example: 'content:javascript', code: 'content:内容' },
  { operator: 'filetype:', description: 'ファイル形式で検索', example: 'filetype:pdf', code: 'filetype:拡張子' },
  { operator: 'before:', description: '指定日以前', example: 'before:2023-12-31', code: 'before:YYYY-MM-DD' },
  { operator: 'after:', description: '指定日以降', example: 'after:2023-01-01', code: 'after:YYYY-MM-DD' },
] as const);

// 検索ヘルプテキストを取得
export function getSearchHelpText(): readonly SearchHelpItem[] {
  return SEARCH_HELP_ITEMS;
}

// プレースホルダーテキストを取得（高速化）
export function getSearchPlaceholder(searchTerm: string, isRegex = false): string {
  if (!searchTerm) {
    return '検索語を入力（&:AND, |:OR, !:NOT, "":完全一致, *:ワイルドカード）';
  }
  
  if (isRegex) {
    return '正規表現モード';
  }
  
  if (hasLogicalOperators(searchTerm)) {
    return '論理演算モード';
  }
  
  return '通常検索モード';
}

// パフォーマンステスト用のベンチマーク関数
export function benchmarkSearch<T extends SearchableItem>(
  items: readonly T[],
  searchTerm: string,
  options: SearchOptions = {},
  iterations = 100
): { averageTime: number; results: number } {
  const times: number[] = [];
  let lastResult: T[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    lastResult = filterItems(items, searchTerm, options);
    const end = performance.now();
    times.push(end - start);
  }
  
  const averageTime = times.reduce((sum, time) => sum + time, 0) / iterations;
  
  return {
    averageTime: Math.round(averageTime * 100) / 100, // 小数点第2位まで
    results: lastResult.length,
  };
}
