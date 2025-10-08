import type { UserEntity } from '@/app/lib/core/types/entity-types';
import { isApiSuccess } from '@/app/lib/core/utils/type-guards';
import { userRepository } from '@/app/lib/data/repositories/user-repository';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// RESTful API 標準
// ============================================================================

/** JWT秘密鍵（環境変数から取得） */
const JWT_SECRET = process.env.JWT_SECRET!;

/** RESTful HTTPステータスコード */
export const enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}

/** RESTful エラーコード */
export const enum RestErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// ============================================================================
// RESTful レスポンス型定義
// ============================================================================

/** RESTful 成功レスポンス基底型 */
interface RestSuccessBase {
  readonly success: true;
  readonly timestamp: string;
  readonly requestId?: string;
}

/** RESTful データレスポンス型 */
export interface RestDataResponse<T> extends RestSuccessBase {
  readonly data: T;
  readonly meta?: {
    readonly message?: string;
    readonly version?: string;
  };
}

/** RESTful リストレスポンス型 */
export interface RestListResponse<T> extends RestSuccessBase {
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
    readonly hasNext: boolean;
    readonly hasPrev: boolean;
  };
  readonly meta?: {
    readonly message?: string;
    readonly filters?: Record<string, unknown>;
  };
}

/** RESTful エラーレスポンス型 */
export interface RestErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: RestErrorCode;
    readonly message: string;
    readonly details?: readonly string[];
    readonly field?: string;
  };
  readonly timestamp: string;
  readonly requestId?: string;
}

/** 統合レスポンス型 */
export type RestApiResponse<T = unknown> =
  | RestDataResponse<T>
  | RestListResponse<T>
  | RestErrorResponse;

// ============================================================================
// RESTful レスポンス生成関数
// ============================================================================

/**
 * RESTful 成功データレスポンス作成
 */
export function createRestDataResponse<T>(
  data: T,
  message?: string,
  status: HttpStatus = HttpStatus.OK
): NextResponse {
  const response: RestDataResponse<T> = {
    success: true,
    data,
    meta: message ? { message } : undefined,
    timestamp: new Date().toISOString(),
  } as const;

  return NextResponse.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "frame-ancestors 'none'",
    },
  });
}

/**
 * RESTful リストレスポンス作成
 */
export function createRestListResponse<T>(
  items: readonly T[],
  pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
  },
  message?: string,
  filters?: Record<string, unknown>
): NextResponse {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const response: RestListResponse<T> = {
    success: true,
    data: items,
    pagination: {
      ...pagination,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
    meta: {
      message,
      filters,
    },
    timestamp: new Date().toISOString(),
  } as const;

  return NextResponse.json(response, {
    status: HttpStatus.OK,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "frame-ancestors 'none'",
    },
  });
}

/**
 * RESTful エラーレスポンス作成
 */
export function createRestErrorResponse(
  code: RestErrorCode,
  message: string,
  status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  details?: readonly string[],
  field?: string
): NextResponse {
  const response: RestErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      field,
    },
    timestamp: new Date().toISOString(),
  } as const;

  return NextResponse.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "frame-ancestors 'none'",
    },
  });
}

// ============================================================================
// RESTful 認証・認可
// ============================================================================

/**
 *高速JWT検証とユーザー取得
 */
export async function authenticateUser(): Promise<UserEntity | null> {
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
 * 認証必須チェック
 */
export async function requireAuthentication(): Promise<UserEntity | NextResponse> {
  const user = await authenticateUser();

  if (!user) {
    return createRestErrorResponse(
      RestErrorCode.AUTHENTICATION_REQUIRED,
      'Authentication required. Please provide a valid access token.',
      HttpStatus.UNAUTHORIZED
    );
  }

  return user;
}

/**
 * 管理者権限必須チェック
 */
export async function requireAdminAuthorization(): Promise<UserEntity | NextResponse> {
  const user = await authenticateUser();

  if (!user) {
    return createRestErrorResponse(
      RestErrorCode.AUTHENTICATION_REQUIRED,
      'Authentication required. Please provide a valid access token.',
      HttpStatus.UNAUTHORIZED
    );
  }

  if (user.role !== 'admin') {
    return createRestErrorResponse(
      RestErrorCode.AUTHORIZATION_FAILED,
      'Insufficient privileges. Administrator access required.',
      HttpStatus.FORBIDDEN
    );
  }

  return user;
}

// ============================================================================
// RESTful リクエスト処理
// ============================================================================

/**
 * RESTful クエリパラメータ解析
 */
export function parseRestQueryParams(searchParams: URLSearchParams) {
  // ページネーション
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

  // 検索・フィルタリング
  const search = searchParams.get('search')?.trim() || undefined;
  const sortBy = searchParams.get('sort_by')?.trim() || undefined;
  const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

  // フィールド選択
  const fields = searchParams.get('fields')?.split(',').map(f => f.trim()).filter(Boolean);

  return {
    pagination: { page, limit },
    search,
    sorting: { sortBy, sortOrder },
    fields,
    filters: Object.fromEntries(
      Array.from(searchParams.entries())
        .filter(([key]) => !['page', 'limit', 'search', 'sort_by', 'sort_order', 'fields'].includes(key))
    ),
  } as const;
}

/**
 * RESTful JSON ボディ解析
 */
export async function parseRestRequestBody<T>(
  request: NextRequest,
  validator: (data: unknown) => data is T
): Promise<T | NextResponse> {
  try {
    // Content-Type チェック
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return createRestErrorResponse(
        RestErrorCode.VALIDATION_FAILED,
        'Invalid Content-Type. Expected application/json.',
        HttpStatus.BAD_REQUEST
      );
    }

    const body = await request.json();

    if (!validator(body)) {
      return createRestErrorResponse(
        RestErrorCode.VALIDATION_FAILED,
        'Request body validation failed. Please check the required fields and data types.',
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }

    return body;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return createRestErrorResponse(
        RestErrorCode.VALIDATION_FAILED,
        'Invalid JSON format in request body.',
        HttpStatus.BAD_REQUEST
      );
    }

    return createRestErrorResponse(
      RestErrorCode.INTERNAL_ERROR,
      'Failed to process request body.',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * RESTful メソッド許可チェック
 */
export function checkAllowedMethods(
  method: string,
  allowedMethods: readonly string[]
): NextResponse | null {
  if (!allowedMethods.includes(method)) {
    return createRestErrorResponse(
      RestErrorCode.VALIDATION_FAILED,
      `Method ${method} not allowed. Allowed methods: ${allowedMethods.join(', ')}.`,
      HttpStatus.METHOD_NOT_ALLOWED
    );
  }
  return null;
}
