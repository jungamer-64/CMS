/**
 * 基本的なプリミティブ型とユニオン型
 * 
 * このファイルは最も基本的な型定義を含み、
 * 他の型定義ファイルの基盤となります。
 */

// ============================================================================
// ユーザー関連基本型
// ============================================================================

/**
 * ユーザーロール型
 * システム内でのユーザーの権限レベルを定義
 */
export type UserRole = 'user' | 'admin';

// ============================================================================
// ソート・順序関連型
// ============================================================================

/**
 * ソート順序型
 * データベースクエリやAPI応答での並び順を指定
 */
export type SortOrder = 'asc' | 'desc';

/**
 * 投稿フィルタータイプ
 * 投稿の表示状態によるフィルタリング
 */
export type PostType = 'all' | 'published' | 'deleted';

/**
 * 投稿ステータス型
 * 投稿の実際のステータス（下書き、公開等）
 */
export type PostStatus = 'draft' | 'published' | 'archived' | 'deleted';

// ============================================================================
// ソート可能フィールド型
// ============================================================================

/**
 * 投稿でソート可能なフィールド
 */
export type PostSortField = 'createdAt' | 'updatedAt' | 'title';

/**
 * ユーザーでソート可能なフィールド
 */
export type UserSortField = 'createdAt' | 'username' | 'displayName';

// ============================================================================
// メディア関連基本型
// ============================================================================

/**
 * メディアファイルの種類
 */
export type MediaType = 'image' | 'video' | 'other';

// ============================================================================
// HTTP関連基本型
// ============================================================================

/**
 * HTTPメソッド型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// ============================================================================
// API関連基本型
// ============================================================================

/**
 * APIエラーコード定数
 * エラーの種類を識別するための標準コード
 */
export enum ApiErrorCode {
  // 認証・認可エラー
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  
  // バリデーションエラー
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // リソースエラー
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // サーバーエラー
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // 外部サービスエラー
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

/**
 * 一般エラーコード型
 */
export type GeneralErrorCode = 
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * 統合エラーコード型
 */
export type ErrorCode = ApiErrorCode | GeneralErrorCode;

/**
 * HTTPステータスコード型
 */
export type HttpStatusCode = 
  | 200 | 201 | 204
  | 400 | 401 | 403 | 404 | 409 | 422 | 429
  | 500 | 502 | 503;
