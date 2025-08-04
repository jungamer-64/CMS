/**
 * 高速・厳格型安全APIユーティリティ関数
 * 
 * - 型安全なレスポンス生成
 * - 一貫したエラーハンドリング
 * - パフォーマンス最適化
 */

import type { ApiSuccess, ApiError } from './core/types';
import { ApiErrorCode } from './core/types';
import { NextResponse } from 'next/server';

/**
 * 成功レスポンスを作成
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, unknown>
): ApiSuccess<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta: { ...meta, timestamp: new Date().toISOString() } }),
  };
}

/**
 * エラーレスポンスを作成
 * @param error エラーメッセージ
 * @param codeOrStatus ApiErrorCode または HTTPステータスコード
 * @param details 追加詳細情報
 */
export function createErrorResponse(
  error: string,
  codeOrStatus?: ApiErrorCode | number,
  details?: Record<string, unknown>
): ApiError {
  // 数値の場合はHTTPステータスコードとして扱い、適切なApiErrorCodeに変換
  let code: ApiErrorCode | undefined;
  
  if (typeof codeOrStatus === 'number') {
    switch (codeOrStatus) {
      case 400:
        code = ApiErrorCode.VALIDATION_ERROR;
        break;
      case 401:
        code = ApiErrorCode.UNAUTHORIZED;
        break;
      case 403:
        code = ApiErrorCode.FORBIDDEN;
        break;
      case 404:
        code = ApiErrorCode.NOT_FOUND;
        break;
      case 500:
      default:
        code = ApiErrorCode.INTERNAL_ERROR;
        break;
    }
  } else if (typeof codeOrStatus === 'string') {
    code = codeOrStatus;
  }

  return {
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details }),
  };
}

/**
 * バリデーションエラーレスポンスを作成
 */
export function createValidationErrorResponse(
  field: string,
  message: string
): ApiError {
  return createErrorResponse(
    `Validation failed for field: ${field}`,
    ApiErrorCode.VALIDATION_ERROR,
    { field, message }
  );
}

/**
 * 必須フィールドのバリデーション
 */
export function validateRequired<T>(
  data: Record<string, unknown>,
  requiredFields: (keyof T)[]
): string | null {
  for (const field of requiredFields) {
    if (!data[field as string] || data[field as string] === '') {
      return `Field '${String(field)}' is required`;
    }
  }
  return null;
}

/**
 * JSONパースエラーハンドリング
 */
export async function parseJsonSafely<T>(
  request: Request
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await request.json();
    return { success: true, data };
  } catch {
    return { 
      success: false, 
      error: 'Invalid JSON format' 
    };
  }
}

/**
 * ページネーション パラメータのパース
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

/**
 * ソートパラメータのパース
 */
export function parseSortParams(
  searchParams: URLSearchParams,
  defaultField: string = 'createdAt',
  defaultOrder: 'asc' | 'desc' = 'desc'
): {
  sortField: string;
  sortOrder: 'asc' | 'desc';
} {
  const sortField = searchParams.get('sort') || defaultField;
  const order = searchParams.get('order');
  const sortOrder = order === 'asc' ? 'asc' : defaultOrder;
  
  return { sortField, sortOrder };
}

/**
 * フィルターパラメータのパース
 */
export function parseFilterParams(
  searchParams: URLSearchParams,
  allowedFilters: string[]
): Record<string, string> {
  const filters: Record<string, string> = {};
  
  for (const filter of allowedFilters) {
    const value = searchParams.get(filter);
    if (value) {
      filters[filter] = value;
    }
  }
  
  return filters;
}

/**
 * NextResponse形式での成功レスポンスを作成
 */
export function createNextSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, unknown>
): NextResponse<ApiSuccess<T>> {
  const response = createSuccessResponse(data, message, meta);
  return NextResponse.json(response);
}

/**
 * NextResponse形式でのエラーレスポンスを作成
 */
export function createNextErrorResponse(
  error: string,
  codeOrStatus?: ApiErrorCode | number,
  details?: Record<string, unknown>
): NextResponse<ApiError> {
  const response = createErrorResponse(error, codeOrStatus, details);
  
  // HTTPステータスコードを決定
  let status = 500;
  if (typeof codeOrStatus === 'number') {
    status = codeOrStatus;
  } else if (codeOrStatus === ApiErrorCode.VALIDATION_ERROR) {
    status = 400;
  } else if (codeOrStatus === ApiErrorCode.UNAUTHORIZED) {
    status = 401;
  } else if (codeOrStatus === ApiErrorCode.FORBIDDEN) {
    status = 403;
  } else if (codeOrStatus === ApiErrorCode.NOT_FOUND) {
    status = 404;
  }
  
  return NextResponse.json(response, { status });
}
