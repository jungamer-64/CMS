/**
 * エラー作成ユーティリティ
 * 
 * BaseErrorとApiErrorのインスタンスを作成するためのヘルパー関数を提供します。
 */

import { BaseError, ApiError } from '../errors';
import type { ErrorCode, HttpStatusCode, ApiErrorCode } from '../types';

/**
 * BaseErrorインスタンスを作成
 */
export function createError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): BaseError {
  // BaseErrorは抽象クラスなので、代わりに適切な具象クラスを使用
  return new ApiError(message, 500, code as ApiErrorCode, details);
}

/**
 * ApiErrorインスタンスを作成
 */
export function createApiError(
  statusCode: HttpStatusCode,
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiError {
  return new ApiError(message, statusCode, code, details);
}
