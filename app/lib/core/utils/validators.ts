/**
 * バリデーター関数
 * 
 * データバリデーションのための関数群を提供します。
 * 型ガードと組み合わせて使用し、構造化されたバリデーション結果を返します。
 */

import type {
  ValidationResult,
  ValidationSuccess,
  ValidationErrorResult,
  ValidationIssue,
  ValidationErrorCode,
  PostRequestParams,
  PaginationParams,
} from '../types';

import type {
  SortParams,
} from '../types/api-types';

import {
  isUserRole,
  isSortOrder,
  isPostType,
  isMediaType,
  isPositiveInteger,
  isNonEmptyString,
  isValidEmail,
  isValidUrl,
} from './type-guards';

// ============================================================================
// バリデーション結果作成ヘルパー
// ============================================================================

/**
 * バリデーション成功結果を作成
 */
function createValidationSuccess<T>(data: T): ValidationSuccess<T> {
  return { success: true, data };
}

/**
 * バリデーションエラー結果を作成
 */
function createValidationError(errors: ValidationIssue[]): ValidationErrorResult {
  return { success: false, errors };
}

/**
 * 単一のバリデーション問題を作成
 */
function createValidationIssue(
  field: string,
  message: string,
  code: ValidationErrorCode,
  value?: unknown
): ValidationIssue {
  return { field, message, code, value };
}

// ============================================================================
// 基本バリデーター
// ============================================================================

/**
 * 必須フィールドのバリデーション
 */
export function validateRequired(
  value: unknown,
  field: string
): ValidationResult<unknown> {
  if (value === undefined || value === null || value === '') {
    return createValidationError([
      createValidationIssue(field, `${field}は必須です`, 'REQUIRED', value)
    ]);
  }
  return createValidationSuccess(value);
}

/**
 * 文字列長のバリデーション
 */
export function validateStringLength(
  value: unknown,
  field: string,
  minLength: number,
  maxLength: number
): ValidationResult<string> {
  if (typeof value !== 'string') {
    return createValidationError([
      createValidationIssue(field, `${field}は文字列である必要があります`, 'INVALID_TYPE', value)
    ]);
  }

  if (value.length < minLength) {
    return createValidationError([
      createValidationIssue(field, `${field}は${minLength}文字以上である必要があります`, 'TOO_SHORT', value)
    ]);
  }

  if (value.length > maxLength) {
    return createValidationError([
      createValidationIssue(field, `${field}は${maxLength}文字以下である必要があります`, 'TOO_LONG', value)
    ]);
  }

  return createValidationSuccess(value);
}

/**
 * 数値範囲のバリデーション
 */
export function validateNumberRange(
  value: unknown,
  field: string,
  min: number,
  max: number
): ValidationResult<number> {
  if (typeof value !== 'number') {
    return createValidationError([
      createValidationIssue(field, `${field}は数値である必要があります`, 'INVALID_TYPE', value)
    ]);
  }

  if (value < min || value > max) {
    return createValidationError([
      createValidationIssue(field, `${field}は${min}から${max}の間である必要があります`, 'OUT_OF_RANGE', value)
    ]);
  }

  return createValidationSuccess(value);
}

/**
 * Emailアドレスのバリデーション
 */
export function validateEmail(
  value: unknown,
  field: string
): ValidationResult<string> {
  if (!isValidEmail(value)) {
    return createValidationError([
      createValidationIssue(field, `${field}は有効なEmailアドレスである必要があります`, 'INVALID_EMAIL', value)
    ]);
  }

  return createValidationSuccess(value);
}

/**
 * URLのバリデーション
 */
export function validateUrl(
  value: unknown,
  field: string
): ValidationResult<string> {
  if (!isValidUrl(value)) {
    return createValidationError([
      createValidationIssue(field, `${field}は有効なURLである必要があります`, 'INVALID_URL', value)
    ]);
  }

  return createValidationSuccess(value);
}

// ============================================================================
// 列挙型バリデーター
// ============================================================================

/**
 * ユーザーロールのバリデーション
 */
export function validateUserRole(
  value: unknown,
  field: string
): ValidationResult<'user' | 'admin'> {
  if (!isUserRole(value)) {
    return createValidationError([
      createValidationIssue(field, `${field}は'user'または'admin'である必要があります`, 'INVALID_ENUM_VALUE', value)
    ]);
  }

  return createValidationSuccess(value);
}

/**
 * ソート順序のバリデーション
 */
export function validateSortOrder(
  value: unknown,
  field: string
): ValidationResult<'asc' | 'desc'> {
  if (!isSortOrder(value)) {
    return createValidationError([
      createValidationIssue(field, `${field}は'asc'または'desc'である必要があります`, 'INVALID_ENUM_VALUE', value)
    ]);
  }

  return createValidationSuccess(value);
}

/**
 * 投稿タイプのバリデーション
 */
export function validatePostType(
  value: unknown,
  field: string
): ValidationResult<'all' | 'published' | 'deleted'> {
  if (!isPostType(value)) {
    return createValidationError([
      createValidationIssue(field, `${field}は'all'、'published'、または'deleted'である必要があります`, 'INVALID_ENUM_VALUE', value)
    ]);
  }

  return createValidationSuccess(value);
}

/**
 * メディアタイプのバリデーション
 */
export function validateMediaType(
  value: unknown,
  field: string
): ValidationResult<'image' | 'video' | 'other'> {
  if (!isMediaType(value)) {
    return createValidationError([
      createValidationIssue(field, `${field}は'image'、'video'、または'other'である必要があります`, 'INVALID_ENUM_VALUE', value)
    ]);
  }

  return createValidationSuccess(value);
}

// ============================================================================
// 複合バリデーター
// ============================================================================

/**
 * ページネーションパラメータのバリデーション
 */
export function validatePaginationParams(
  params: unknown
): ValidationResult<PaginationParams> {
  const errors: ValidationIssue[] = [];

  if (typeof params !== 'object' || params === null) {
    return createValidationError([
      createValidationIssue('params', 'パラメータはオブジェクトである必要があります', 'INVALID_TYPE', params)
    ]);
  }

  const typedParams = params as Record<string, unknown>;
  let result: Partial<PaginationParams> = {};

  // pageのバリデーション
  if (typedParams.page !== undefined) {
    if (!isPositiveInteger(typedParams.page)) {
      errors.push(createValidationIssue('page', 'ページは正の整数である必要があります', 'INVALID_TYPE', typedParams.page));
    } else {
      result = { ...result, page: typedParams.page };
    }
  }

  // limitのバリデーション
  if (typedParams.limit !== undefined) {
    if (!isPositiveInteger(typedParams.limit) || typedParams.limit > 100) {
      errors.push(createValidationIssue('limit', 'リミットは1から100の間の整数である必要があります', 'OUT_OF_RANGE', typedParams.limit));
    } else {
      result = { ...result, limit: typedParams.limit };
    }
  }

  if (errors.length > 0) {
    return createValidationError(errors);
  }

  return createValidationSuccess(result as PaginationParams);
}

/**
 * ソートパラメータのバリデーション
 */
export function validateSortParams<T extends string>(
  params: unknown,
  validSortFields: T[]
): ValidationResult<SortParams> {
  const errors: ValidationIssue[] = [];

  if (typeof params !== 'object' || params === null) {
    return createValidationError([
      createValidationIssue('params', 'パラメータはオブジェクトである必要があります', 'INVALID_TYPE', params)
    ]);
  }

  const typedParams = params as Record<string, unknown>;
  let result: Partial<SortParams> = {};

  // sortByのバリデーション
  if (typedParams.sortBy !== undefined) {
    if (typeof typedParams.sortBy !== 'string' || !validSortFields.includes(typedParams.sortBy as T)) {
      errors.push(createValidationIssue('sortBy', `ソートフィールドは${validSortFields.join(', ')}のいずれかである必要があります`, 'INVALID_ENUM_VALUE', typedParams.sortBy));
    } else {
      result = { ...result, sortBy: typedParams.sortBy as T };
    }
  }

  // sortOrderのバリデーション
  if (typedParams.sortOrder !== undefined) {
    if (!isSortOrder(typedParams.sortOrder)) {
      errors.push(createValidationIssue('sortOrder', 'ソート順序は\'asc\'または\'desc\'である必要があります', 'INVALID_ENUM_VALUE', typedParams.sortOrder));
    } else {
      result = { ...result, sortOrder: typedParams.sortOrder };
    }
  }

  if (errors.length > 0) {
    return createValidationError(errors);
  }

  return createValidationSuccess(result as SortParams);
}

/**
 * 投稿リクエストパラメータの個別フィールドバリデーション
 */
function validatePostRequestFields(
  params: Record<string, unknown>,
  errors: ValidationIssue[]
): Partial<PostRequestParams> {
  let result: Partial<PostRequestParams> = {};

  // typeのバリデーション
  if (params.type !== undefined) {
    const typeResult = validatePostType(params.type, 'type');
    if (typeResult.success) {
      result = { ...result, type: typeResult.data };
    } else {
      errors.push(...typeResult.errors);
    }
  }

  // authorのバリデーション
  if (params.author !== undefined) {
    if (!isNonEmptyString(params.author)) {
      errors.push(createValidationIssue('author', '作者は空でない文字列である必要があります', 'INVALID_TYPE', params.author));
    } else {
      result = { ...result, author: params.author };
    }
  }

  // searchのバリデーション
  if (params.search !== undefined) {
    if (typeof params.search !== 'string') {
      errors.push(createValidationIssue('search', '検索キーワードは文字列である必要があります', 'INVALID_TYPE', params.search));
    } else {
      result = { ...result, search: params.search };
    }
  }

  return result;
}

/**
 * 投稿リクエストパラメータのバリデーション
 */
export function validatePostRequestParams(
  params: unknown
): ValidationResult<PostRequestParams> {
  if (typeof params !== 'object' || params === null) {
    return createValidationError([
      createValidationIssue('params', 'パラメータはオブジェクトである必要があります', 'INVALID_TYPE', params)
    ]);
  }

  const errors: ValidationIssue[] = [];
  let result: PostRequestParams = {};

  // ページネーションのバリデーション
  const paginationResult = validatePaginationParams(params);
  if (paginationResult.success) {
    result = { ...result, ...paginationResult.data };
  } else {
    errors.push(...paginationResult.errors);
  }

  // ソートのバリデーション
  const sortResult = validateSortParams(params, ['createdAt', 'updatedAt', 'title'] as const);
  if (sortResult.success) {
    result = { ...result, ...sortResult.data as { sortBy?: 'createdAt' | 'updatedAt' | 'title'; sortOrder?: 'asc' | 'desc' } };
  } else {
    errors.push(...sortResult.errors);
  }

  // 個別フィールドのバリデーション
  const fieldResult = validatePostRequestFields(params as Record<string, unknown>, errors);
  result = { ...result, ...fieldResult };

  if (errors.length > 0) {
    return createValidationError(errors);
  }

  return createValidationSuccess(result);
}

/**
 * 複数のバリデーション結果をマージ
 */
export function mergeValidationResults<T>(
  results: ValidationResult<Partial<T>>[]
): ValidationResult<T> {
  const errors: ValidationIssue[] = [];
  let mergedData = {} as T;

  for (const result of results) {
    if (result.success) {
      mergedData = { ...mergedData, ...result.data };
    } else {
      errors.push(...result.errors);
    }
  }

  if (errors.length > 0) {
    return createValidationError(errors);
  }

  return createValidationSuccess(mergedData);
}
