/**
 * コアモジュール統合エクスポート
 * 
 * libフォルダのコア機能を一箇所から提供します。
 * 型定義、エラーハンドリング、ユーティリティを統合し、
 * アプリケーション全体で一貫した基盤を提供します。
 */

// ============================================================================
// 型定義をエクスポート
// ============================================================================

/**
 * 全ての型定義を再エクスポート
 * 基本型、エンティティ型、レスポンス型、バリデーション型を含む
 */
export * from './types';

// ============================================================================
// エラーハンドリングをエクスポート
// ============================================================================

/**
 * 統一されたエラークラスとユーティリティを再エクスポート
 * BaseError、ApiError、およびエラー判定・変換ユーティリティを含む
 */
export * from './errors';

// ============================================================================
// ユーティリティ関数をエクスポート（重複を避けるため選択的エクスポート）
// ============================================================================

/**
 * 選択的エクスポート: errors との重複関数（createError, createApiError）を除外
 * 型ガード、バリデーター、フォーマッターを含む
 */
export {
  // 型ガード関数
  isApiSuccess,
  isApiError,
  isUserRole,
  isSortOrder,
  isPostType,
  isMediaType,
  isHttpMethod,
  isApiErrorCode,
  isPostSortField,
  isUserSortField,
  isStringArray,
  isNumberArray,
  isNonNullObject,
  
  // フォーマッター関数
  formatSuccessResponse,
  formatErrorResponse,
  
  // バリデーター関数
  validateRequired,
  validateEmail,
  validateUserRole,
  validateSortOrder,
  validatePostType,
  validateMediaType,
  validatePaginationParams,
  validateSortParams,
} from './utils';

// ============================================================================
// よく使用される型の便利なエイリアス
// ============================================================================

import type {
  ApiResponse,
  ApiSuccess,
  ApiError,
  Post,
  User,
  Comment,
  MediaFile,
  UserRole,
  SortOrder,
  PostType,
  MediaType,
} from './types';

/**
 * 頻繁に使用される型の便利なエイリアス
 * インポートを簡素化し、コードの可読性を向上させます
 */
export type {
  // レスポンス型
  ApiResponse,
  ApiSuccess,
  ApiError,
  
  // エンティティ型
  Post,
  User,
  Comment,
  MediaFile,
  
  // 基本型
  UserRole,
  SortOrder,
  PostType,
  MediaType,
};

// ============================================================================
// 便利な再エクスポート
// ============================================================================

/**
 * 注意: 上記で選択的エクスポートによって既にエクスポート済み
 * 重複エクスポートを避けるため、個別インポートは削除
 */
