/**
 * API関連型定義
 * 
 * HTTP通信、APIエンドポイント等で使用される型を定義します。
 * 基本型はbase-types.tsで定義されているものを使用します。
 */

import type { PaginationParams, SortParams } from './validation-types';
import type { MediaType, ApiErrorCode } from './base-types';

// 再エクスポート（他のファイルで使用できるように）
export type { PaginationParams, SortParams } from './validation-types';
export type { MediaType, ApiErrorCode } from './base-types';

// ============================================================================
// リクエスト/レスポンス型
// ============================================================================

/**
 * フィルター情報
 */
export interface FilterParams {
  readonly search?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

/**
 * 統合クエリパラメータ
 */
export interface QueryParams extends PaginationParams, SortParams<string>, FilterParams {
  readonly [key: string]: unknown;
}

// ============================================================================
// APIキー関連型
// ============================================================================

/**
 * APIキー作成リクエスト
 */
export interface ApiKeyCreateRequest {
  readonly name: string;
  readonly description?: string;
}

/**
 * APIキー更新リクエスト
 */
export interface ApiKeyUpdateRequest {
  readonly name?: string;
  readonly description?: string;
  readonly isActive?: boolean;
}

// ============================================================================
// 管理者関連型
// ============================================================================

/**
 * 管理者用コメント更新リクエスト
 */
export interface AdminCommentUpdateRequest {
  readonly commentId: string;
  readonly isApproved: boolean;
  readonly moderatorNote?: string;
}

/**
 * 管理者用コメント削除リクエスト
 */
export interface AdminCommentDeleteRequest {
  readonly commentId: string;
  readonly reason?: string;
}

// ============================================================================
// メディア関連型
// ============================================================================

/**
 * メディアアイテム
 */
export interface MediaItem {
  readonly id: string;
  readonly filename: string;
  readonly originalName: string;
  readonly size: number;
  readonly uploadDate: string;
  readonly url: string;
  readonly mediaType: MediaType;
}

// ============================================================================
// 認証関連型
// ============================================================================

/**
 * ログインリクエスト
 */
export interface LoginRequest {
  readonly username: string;
  readonly password: string;
}

/**
 * 認証レスポンス
 */
export interface AuthResponse {
  readonly token: string;
  readonly user: {
    readonly id: string;
    readonly username: string;
    readonly email: string;
    readonly displayName: string;
    readonly role: 'user' | 'admin';
    readonly darkMode?: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  };
}
