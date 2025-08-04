/**
 * 統一されたAPIレスポンス型定義
 * 
 * 全てのAPI応答で一貫した形式を提供し、
 * 型安全性を確保します。
 */

import type { ApiErrorCode } from './base-types';

// ============================================================================
// 成功レスポンス型
// ============================================================================

/**
 * API成功レスポンス
 * 
 * @template T レスポンスデータの型
 */
export interface ApiSuccess<T = unknown> {
  readonly success: true;
  readonly data: T;
  readonly message?: string;
  readonly meta?: ResponseMeta;
}

// ============================================================================
// エラーレスポンス型
// ============================================================================

/**
 * APIエラーレスポンス
 */
export interface ApiError {
  readonly success: false;
  readonly error: string;
  readonly code?: ApiErrorCode;
  readonly details?: Record<string, unknown>;
}

// ============================================================================
// 統合レスポンス型
// ============================================================================

/**
 * 統一されたAPIレスポンス型
 * 成功またはエラーの両方の可能性を表現
 * 
 * @template T 成功時のデータ型
 */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ============================================================================
// メタデータ型
// ============================================================================

/**
 * レスポンスメタデータ
 * API応答に付随する追加情報
 */
export interface ResponseMeta {
  readonly timestamp: string;
  readonly requestId?: string;
  readonly pagination?: PaginationMeta;
}

/**
 * ページネーション情報
 */
export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> extends ApiSuccess<T> {
  readonly pagination: PaginationMeta;
}

// ============================================================================
// レスポンス作成ヘルパー型
// ============================================================================

/**
 * 成功レスポンス作成のパラメータ
 */
export interface CreateSuccessResponseParams<T> {
  readonly data: T;
  readonly message?: string;
  readonly meta?: ResponseMeta;
}

/**
 * エラーレスポンス作成のパラメータ
 */
export interface CreateErrorResponseParams {
  readonly error: string;
  readonly code?: ApiErrorCode;
  readonly details?: Record<string, unknown>;
}

// ============================================================================
// レスポンス作成ヘルパー関数
// ============================================================================

/**
 * 成功レスポンスを作成
 */
export function createApiSuccess<T>(
  data: T,
  message?: string,
  meta?: ResponseMeta
): ApiSuccess<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };
}
