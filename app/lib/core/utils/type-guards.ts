/**
 * 型安全な型ガード関数の統一
 * 
 * 実行時の型チェックを行い、TypeScriptの型推論を支援します。
 * 全ての型ガードは純粋関数として実装され、副作用を持ちません。
 */

import type {
  UserRole,
  SortOrder,
  PostType,
  MediaType,
  PostSortField,
  UserSortField,
  HttpMethod,
  ApiErrorCode,
  ApiResponse,
  ApiSuccess,
  ApiError,
  ValidationResult,
  ValidationSuccess,
  ValidationErrorResult,
} from '../types';

// ============================================================================
// 基本型ガード
// ============================================================================

/**
 * ユーザーロールの型ガード
 */
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ['user', 'admin'].includes(value);
}

/**
 * ソート順序の型ガード
 */
export function isSortOrder(value: unknown): value is SortOrder {
  return typeof value === 'string' && ['asc', 'desc'].includes(value);
}

/**
 * 投稿タイプの型ガード
 */
export function isPostType(value: unknown): value is PostType {
  return typeof value === 'string' && ['all', 'published', 'deleted'].includes(value);
}

/**
 * メディアタイプの型ガード
 */
export function isMediaType(value: unknown): value is MediaType {
  return typeof value === 'string' && ['image', 'video', 'other'].includes(value);
}

/**
 * HTTPメソッドの型ガード
 */
export function isHttpMethod(value: unknown): value is HttpMethod {
  return typeof value === 'string' && ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(value);
}

/**
 * APIエラーコードの型ガード
 */
export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  const validCodes = [
    'VALIDATION_ERROR',
    'AUTHENTICATION_ERROR',
    'AUTHORIZATION_ERROR',
    'NOT_FOUND_ERROR',
    'CONFLICT_ERROR',
    'RATE_LIMIT_ERROR',
    'INTERNAL_SERVER_ERROR',
    'EXTERNAL_SERVICE_ERROR',
  ];
  return typeof value === 'string' && validCodes.includes(value as ApiErrorCode);
}

// ============================================================================
// ソートフィールド型ガード
// ============================================================================

/**
 * 投稿ソートフィールドの型ガード
 */
export function isPostSortField(value: unknown): value is PostSortField {
  return typeof value === 'string' && ['createdAt', 'updatedAt', 'title'].includes(value);
}

/**
 * ユーザーソートフィールドの型ガード
 */
export function isUserSortField(value: unknown): value is UserSortField {
  return typeof value === 'string' && ['createdAt', 'username', 'displayName'].includes(value);
}

// ============================================================================
// APIレスポンス型ガード
// ============================================================================

/**
 * API成功レスポンスの型ガード
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    response.success === true &&
    'data' in response
  );
}

/**
 * APIエラーレスポンスの型ガード
 */
export function isApiError<T>(response: ApiResponse<T>): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    response.success === false &&
    'error' in response &&
    typeof response.error === 'string'
  );
}

// ============================================================================
// バリデーション結果型ガード
// ============================================================================

/**
 * バリデーション成功の型ガード
 */
export function isValidationSuccess<T>(result: ValidationResult<T>): result is ValidationSuccess<T> {
  return (
    typeof result === 'object' &&
    result !== null &&
    result.success === true &&
    'data' in result
  );
}

/**
 * バリデーションエラーの型ガード
 */
export function isValidationError<T>(result: ValidationResult<T>): result is ValidationErrorResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    result.success === false &&
    'errors' in result &&
    Array.isArray(result.errors)
  );
}

// ============================================================================
// 配列型ガード
// ============================================================================

/**
 * 文字列配列の型ガード
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/**
 * 数値配列の型ガード
 */
export function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === 'number');
}

/**
 * 読み取り専用文字列配列の型ガード
 */
export function isReadonlyStringArray(value: unknown): value is readonly string[] {
  return isStringArray(value);
}

// ============================================================================
// オブジェクト型ガード
// ============================================================================

/**
 * nullでないオブジェクトの型ガード
 */
export function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 空のオブジェクトでないことの型ガード
 */
export function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return isNonNullObject(value) && Object.keys(value).length > 0;
}

// ============================================================================
// 日付型ガード
// ============================================================================

/**
 * 有効なDateオブジェクトの型ガード
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * ISO日付文字列の型ガード
 */
export function isISODateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  
  const date = new Date(value);
  return isValidDate(date) && date.toISOString() === value;
}

// ============================================================================
// URL・Email型ガード
// ============================================================================

/**
 * 有効なEmailアドレスの型ガード
 */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * 有効なURLの型ガード
 */
export function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// 数値範囲型ガード
// ============================================================================

/**
 * 正の整数の型ガード
 */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * 非負の整数の型ガード
 */
export function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/**
 * 指定範囲内の数値の型ガード
 */
export function isNumberInRange(min: number, max: number) {
  return (value: unknown): value is number => {
    return typeof value === 'number' && value >= min && value <= max;
  };
}

// ============================================================================
// 文字列長型ガード
// ============================================================================

/**
 * 空でない文字列の型ガード
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 指定長範囲内の文字列の型ガード
 */
export function isStringInLength(minLength: number, maxLength: number) {
  return (value: unknown): value is string => {
    return typeof value === 'string' && 
           value.length >= minLength && 
           value.length <= maxLength;
  };
}
