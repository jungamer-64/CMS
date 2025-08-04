import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import type { UserEntity } from '@/app/lib/core/types/entity-types';
import { userRepository } from '@/app/lib/data/repositories/user-repository';
import { isApiSuccess } from '@/app/lib/core/utils/type-guards';

// ============================================================================
// 厳格な型定義
// ============================================================================

/** JWT秘密鍵（環境変数から取得） */
const JWT_SECRET = process.env.JWT_SECRET!;

/** APIエラーコード列挙型 */
export const enum ApiErrorCode {
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  VALIDATION_ERROR = 400,
  INTERNAL_ERROR = 500,
}

/** 成功レスポンス型 */
export interface ApiSuccessResponse<T = unknown> {
  readonly success: true;
  readonly data: T;
  readonly message?: string;
  readonly timestamp: string;
}

/** エラーレスポンス型 */
export interface ApiErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly code: ApiErrorCode;
  readonly timestamp: string;
}

/** 統合レスポンス型 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** ページネーション型 */
export interface PaginationInfo {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

/** リスト型 */
export interface ListResponse<T> {
  readonly items: readonly T[];
  readonly pagination: PaginationInfo;
}

// ============================================================================
// 高速レスポンス生成関数
// ============================================================================

/**
 * 厳格に型安全な成功レスポンス作成
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  } as const;
  
  return NextResponse.json(response, { 
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * 厳格に型安全なエラーレスポンス作成
 */
export function createErrorResponse(
  error: string,
  code: ApiErrorCode = ApiErrorCode.INTERNAL_ERROR
): NextResponse {
  const response: ApiErrorResponse = {
    success: false,
    error,
    code,
    timestamp: new Date().toISOString(),
  } as const;
  
  return NextResponse.json(response, { 
    status: code,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// ============================================================================
// 高速認証ユーティリティ
// ============================================================================

/**
 * 高速JWT検証とユーザー取得
 */
export async function verifyAuthenticatedUser(): Promise<UserEntity | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return null;

    // JWT検証（同期的に高速実行）
    const decoded = jwt.verify(token, JWT_SECRET) as { readonly userId: string };
    
    // ユーザー取得
    const userResult = await userRepository.findById(decoded.userId);
    
    return isApiSuccess(userResult) ? userResult.data : null;
  } catch {
    return null;
  }
}

/**
 * 管理者権限の厳格チェック
 */
export async function requireAdminUser(): Promise<UserEntity | NextResponse> {
  const user = await verifyAuthenticatedUser();
  
  if (!user) {
    return createErrorResponse('認証が必要です', ApiErrorCode.UNAUTHORIZED);
  }
  
  if (user.role !== 'admin') {
    return createErrorResponse('管理者権限が必要です', ApiErrorCode.FORBIDDEN);
  }
  
  return user;
}

// ============================================================================
// リクエストボディ検証
// ============================================================================

/**
 * 型安全なJSONパース
 */
export async function parseRequestBody<T>(
  request: NextRequest,
  validator: (data: unknown) => data is T
): Promise<T | NextResponse> {
  try {
    const body = await request.json();
    
    if (!validator(body)) {
      return createErrorResponse(
        '無効なリクエストボディです',
        ApiErrorCode.VALIDATION_ERROR
      );
    }
    
    return body;
  } catch {
    return createErrorResponse(
      'JSONパースエラー',
      ApiErrorCode.VALIDATION_ERROR
    );
  }
}

/**
 * クエリパラメータの型安全な解析
 */
export function parseQueryParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const search = searchParams.get('search') || undefined;
  
  return { page, limit, search } as const;
}
