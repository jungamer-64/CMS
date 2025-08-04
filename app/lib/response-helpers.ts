/**
 * 高速・厳格型安全APIレスポンスヘルパー
 * 
 * - 厳格型チェック
 * - エラーハンドリング
 * - パフォーマンス最適化
 * - null安全性保証
 */

import type { ApiResponse, ApiSuccess, ApiError, User, Post, SiteSettings } from '@/app/lib/core/types';
import { isApiSuccess, isApiError } from '@/app/lib/core';

/**
 * 型安全APIレスポンスデータ抽出
 */
export const extractData = <T>(response: ApiResponse<T>): T | null => {
  return isApiSuccess(response) ? response.data : null;
};

/**
 * 厳格エラーメッセージ抽出
 */
export const extractError = <T>(response: ApiResponse<T>): string | null => {
  return isApiError(response) ? response.error : null;
};

/**
 * APIレスポンスが成功かどうかをチェック
 */
export function isResponseSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return isApiSuccess(response);
}

/**
 * APIレスポンスがエラーかどうかをチェック
 */
export function isResponseError<T>(response: ApiResponse<T>): response is ApiError {
  return isApiError(response);
}

/**
 * 高速APIレスポンス処理
 */
export const processApiResponse = <T, R>(
  response: ApiResponse<T>,
  onSuccess: (data: T) => R,
  onError?: (error: string) => R
): R | null => {
  if (isApiSuccess(response)) {
    return onSuccess(response.data);
  }
  
  if (onError && isApiError(response)) {
    return onError(response.error);
  }
  
  return null;
};

/**
 * APIレスポンスを安全に処理する（例外ハンドリング付き）
 */
export function handleApiResponse<T, R>(
  response: ApiResponse<T>,
  onSuccess: (data: T) => R,
  onError?: (error: string) => R
): R | null {
  try {
    if (isApiSuccess(response)) {
      return onSuccess(response.data);
    }
    
    if (onError && isApiError(response)) {
      return onError(response.error);
    }
    
    return null;
  } catch (error) {
    console.error('API response processing error:', error);
    return onError ? onError('Processing error occurred') : null;
  }
}

/**
 * User APIレスポンスからプロパティを安全に取得
 */
export function getUserProperty<K extends keyof User>(
  userResponse: ApiResponse<User>,
  property: K
): User[K] | null {
  const user = extractData(userResponse);
  return user ? user[property] : null;
}

/**
 * Post APIレスポンスからプロパティを安全に取得  
 */
export function getPostProperty<K extends keyof Post>(
  postResponse: ApiResponse<Post>,
  property: K
): Post[K] | null {
  const post = extractData(postResponse);
  return post ? post[property] : null;
}

/**
 * Settings APIレスポンスからプロパティを安全に取得
 */
export function getSettingsProperty<K extends keyof SiteSettings>(
  settingsResponse: ApiResponse<SiteSettings>,
  property: K
): SiteSettings[K] | null {
  const settings = extractData(settingsResponse);
  return settings ? settings[property] : null;
}

/**
 * 配列APIレスポンスの長さを安全に取得
 */
export function getArrayLength<T>(arrayResponse: ApiResponse<T[]>): number {
  const array = extractData(arrayResponse);
  return array ? array.length : 0;
}

/**
 * 配列APIレスポンスに対してmapを実行
 */
export function mapArrayResponse<T, R>(
  arrayResponse: ApiResponse<T[]>,
  mapFn: (item: T, index: number) => R
): R[] {
  const array = extractData(arrayResponse);
  return array ? array.map(mapFn) : [];
}

/**
 * 配列APIレスポンスをフィルタリング
 */
export function filterArrayResponse<T>(
  arrayResponse: ApiResponse<T[]>,
  filterFn: (item: T, index: number) => boolean
): T[] {
  const array = extractData(arrayResponse);
  return array ? array.filter(filterFn) : [];
}

/**
 * 配列APIレスポンスから要素を検索
 */
export function findArrayItem<T>(
  arrayResponse: ApiResponse<T[]>,
  findFn: (item: T, index: number) => boolean
): T | null {
  const array = extractData(arrayResponse);
  return array ? array.find(findFn) ?? null : null;
}

/**
 * APIレスポンスの型安全キャッシュラッパー
 */
export class ResponseCache<T> {
  private readonly cache = new Map<string, { data: T; timestamp: number }>();
  private readonly ttl: number;

  constructor(ttlMs: number = 300000) { // 5分デフォルト
    this.ttl = ttlMs;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

/**
 * グローバルレスポンスキャッシュインスタンス
 */
export const globalResponseCache = new ResponseCache<unknown>(300000);

/**
 * キャッシュ対応APIレスポンス処理
 */
export function processApiResponseWithCache<T, R>(
  response: ApiResponse<T>,
  cacheKey: string,
  onSuccess: (data: T) => R,
  onError?: (error: string) => R,
  cache: ResponseCache<T> = globalResponseCache as ResponseCache<T>
): R | null {
  // キャッシュチェック
  const cached = cache.get(cacheKey);
  if (cached) {
    return onSuccess(cached);
  }

  // 通常の処理
  if (isApiSuccess(response)) {
    cache.set(cacheKey, response.data);
    return onSuccess(response.data);
  }
  
  if (onError && isApiError(response)) {
    return onError(response.error);
  }
  
  return null;
}
