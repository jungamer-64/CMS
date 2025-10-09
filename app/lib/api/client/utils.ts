/**
 * API Client Utilities
 * LIB_COMMONIZATION_PLAN.md フェーズ4対応
 *
 * APIクライアント用のユーティリティ関数
 *
 * Note: createSuccessResponse と createErrorResponse は
 * @/app/lib/api-utils からインポートして NextResponse でラップします
 */

import { NextResponse } from 'next/server';
import {
  createErrorResponse as baseCreateErrorResponse,
  createSuccessResponse as baseCreateSuccessResponse,
} from '../../api-utils';
import { ApiError as ApiErrorClass } from '../../core/errors';
import type {
  ApiError,
  ApiErrorCode,
  ApiSuccess
} from '../../core/types';

/**
 * 成功レスポンスを作成（NextResponse版）
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response = baseCreateSuccessResponse(data, message);
  return NextResponse.json(response, { status });
}

/**
 * エラーレスポンスを作成（NextResponse版）
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  code?: ApiErrorCode,
  details?: Record<string, unknown>
): NextResponse {
  const response = baseCreateErrorResponse(error, code, details);
  return NextResponse.json(response, { status });
}

/**
 * APIエラーハンドリング
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ApiErrorClass) {
    return createErrorResponse(
      error.message,
      error.statusCode,
      error.code,
      error.details
    );
  }

  if (error instanceof Error) {
    return createErrorResponse(error.message, 500);
  }

  return createErrorResponse('Internal Server Error', 500);
}

/**
 * API成功レスポンスを作成（互換性関数）
 */
export function createApiSuccess<T>(data: T, message?: string): ApiSuccess<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * APIエラーレスポンスを作成（互換性関数）
 */
export function createApiError(
  error: string,
  code?: ApiErrorCode,
  details?: Record<string, unknown>
): ApiError {
  return {
    success: false,
    error,
    code,
    details,
  };
}

/**
 * リクエストボディを安全にパース
 */
export async function parseRequestBody<T = unknown>(
  request: Request
): Promise<T | null> {
  try {
    const text = await request.text();
    if (!text.trim()) return null;
    return JSON.parse(text) as T;
  } catch (err: unknown) {
    console.error('Failed to parse request body:', err instanceof Error ? err : String(err));
    return null;
  }
}

/**
 * クエリパラメータを型安全に取得
 */
export function getQueryParam(
  url: URL,
  key: string,
  defaultValue?: string
): string | undefined {
  const value = url.searchParams.get(key);
  return value ?? defaultValue;
}

/**
 * 数値型のクエリパラメータを取得
 */
export function getNumericQueryParam(
  url: URL,
  key: string,
  defaultValue?: number
): number | undefined {
  const value = url.searchParams.get(key);
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * ページネーション情報を取得
 */
export function getPaginationParams(url: URL): {
  page: number;
  limit: number;
} {
  const page = Math.max(1, getNumericQueryParam(url, 'page', 1) || 1);
  const limit = Math.max(1, Math.min(100, getNumericQueryParam(url, 'limit', 10) || 10));

  return { page, limit };
}
