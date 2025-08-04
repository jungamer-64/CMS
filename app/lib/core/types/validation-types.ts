/**
 * バリデーション関連型定義
 * 
 * データ検証とスキーマ定義に使用される型を定義します。
 */

// ============================================================================
// バリデーション結果型
// ============================================================================

/**
 * バリデーション成功結果
 */
export interface ValidationSuccess<T = unknown> {
  readonly success: true;
  readonly data: T;
}

/**
 * バリデーションエラー結果
 */
export interface ValidationErrorResult {
  readonly success: false;
  readonly errors: readonly ValidationIssue[];
}

/**
 * バリデーション結果の統合型
 */
export type ValidationResult<T = unknown> = ValidationSuccess<T> | ValidationErrorResult;

/**
 * 個別のバリデーション問題
 */
export interface ValidationIssue {
  readonly field: string;
  readonly message: string;
  readonly code: ValidationErrorCode;
  readonly value?: unknown;
}

/**
 * バリデーションエラーコード
 */
export type ValidationErrorCode =
  | 'REQUIRED'
  | 'INVALID_TYPE'
  | 'INVALID_FORMAT'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'OUT_OF_RANGE'
  | 'INVALID_ENUM_VALUE'
  | 'DUPLICATE_VALUE'
  | 'INVALID_EMAIL'
  | 'INVALID_URL'
  | 'INVALID_DATE'
  | 'CUSTOM_ERROR';

// ============================================================================
// スキーマ定義型
// ============================================================================

/**
 * フィールドバリデーションルール
 */
export interface FieldValidationRule {
  readonly required?: boolean;
  readonly type?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url';
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly min?: number;
  readonly max?: number;
  readonly pattern?: RegExp;
  readonly enum?: readonly (string | number)[];
  readonly custom?: (value: unknown) => ValidationResult<unknown>;
}

/**
 * オブジェクトスキーマ定義
 */
export type ObjectSchema<T> = {
  readonly [K in keyof T]: FieldValidationRule;
};

// ============================================================================
// フォームバリデーション型
// ============================================================================

/**
 * フォームフィールドの状態
 */
export interface FormFieldState {
  readonly value: unknown;
  readonly error?: string;
  readonly touched: boolean;
  readonly dirty: boolean;
}

/**
 * フォーム全体の状態
 */
export interface FormState<T> {
  readonly fields: { readonly [K in keyof T]: FormFieldState };
  readonly isValid: boolean;
  readonly isSubmitting: boolean;
  readonly hasErrors: boolean;
}

// ============================================================================
// リクエストバリデーション型
// ============================================================================

/**
 * ページネーションパラメータのバリデーション
 */
export interface ValidationPaginationParams {
  readonly page?: number;
  readonly limit?: number;
}

/**
 * ページネーションパラメータ（エイリアス）
 */
export type PaginationParams = ValidationPaginationParams;

/**
 * ソートパラメータのバリデーション
 */
export interface ValidationSortParams<T extends string = string> {
  readonly sortBy?: T;
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * ソートパラメータ（エイリアス）
 */
export type SortParams<T extends string = string> = ValidationSortParams<T>;

/**
 * フィルターパラメータのバリデーション
 */
export interface ValidationFilterParams<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly filters?: T;
}

/**
 * 検索パラメータのバリデーション
 */
export interface SearchParams {
  readonly query?: string;
  readonly filters?: Record<string, unknown>;
}

/**
 * 投稿リクエストパラメータ
 */
export interface PostRequestParams extends PaginationParams, SortParams<'createdAt' | 'updatedAt' | 'title'> {
  readonly type?: 'all' | 'published' | 'deleted';
  readonly author?: string;
  readonly search?: string;
}

/**
 * ユーザーリクエストパラメータ
 */
export interface UserRequestParams extends PaginationParams, SortParams<'createdAt' | 'username' | 'displayName'> {
  readonly role?: 'user' | 'admin';
  readonly active?: boolean;
  readonly search?: string;
}

/**
 * メディアリクエストパラメータ
 */
export interface MediaRequestParams extends PaginationParams, SortParams<'createdAt' | 'size' | 'originalName'> {
  readonly mediaType?: 'image' | 'video' | 'other';
  readonly tags?: readonly string[];
  readonly search?: string;
}

// ============================================================================
// 汎用リクエスト型（既存コードとの互換性のため）
// ============================================================================

/**
 * ページネーション可能なリクエスト
 */
export interface PaginatedRequest {
  page?: number;
  limit?: number;
}

/**
 * ソート可能なリクエスト
 */
export interface SortableRequest {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 検索可能なリクエスト
 */
export interface SearchableRequest {
  search?: string;
}

/**
 * 基本リストリクエスト（ページネーション + ソート + 検索）
 */
export type BaseListRequest = PaginatedRequest & SortableRequest & SearchableRequest;
