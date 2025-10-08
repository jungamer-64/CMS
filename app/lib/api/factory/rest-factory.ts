/**
 * 統一 RESTful APIファクトリー
 *
 * REST API準拠の統一されたハンドラー生成システム
 * - 厳格な型安全性
 * - 統一されたエラーハンドリング
 * - パフォーマンス最適化
 * - レート制限
 * - 認証・認可
 */

import { NextRequest, NextResponse } from 'next/server';
import type { UserEntity } from '../../core/types/entity-types';
import {
  checkAllowedMethods,
  createRestDataResponse,
  createRestErrorResponse,
  createRestListResponse,
  HttpStatus,
  parseRestQueryParams,
  parseRestRequestBody,
  requireAdminAuthorization,
  requireAuthentication,
  RestErrorCode,
} from '../utils/rest-helpers';

// ============================================================================
// ハンドラー型定義
// ============================================================================

/**
 * CRUD操作インターフェース
 */
export interface CrudService<TEntity, TCreateInput, TUpdateInput> {
  getAll(filters?: Record<string, unknown>): Promise<{
    success: boolean;
    data?: { data: TEntity[]; pagination: { page: number; limit: number; total: number } };
    error?: string;
  }>;

  getById(id: string): Promise<{
    success: boolean;
    data?: TEntity;
    error?: string;
  }>;

  create(input: TCreateInput): Promise<{
    success: boolean;
    data?: TEntity;
    error?: string;
  }>;

  update(id: string, input: TUpdateInput): Promise<{
    success: boolean;
    data?: TEntity;
    error?: string;
  }>;

  delete(id: string): Promise<{
    success: boolean;
    error?: string;
  }>;
}

/**
 * GET ハンドラー型
 */
export type RestGetHandler<T = unknown> = (
  request: NextRequest,
  user?: UserEntity,
  params?: Record<string, string>
) => Promise<T>;

/**
 * POST ハンドラー型
 */
export type RestPostHandler<TBody = unknown, TResponse = unknown> = (
  request: NextRequest,
  body: TBody,
  user?: UserEntity,
  params?: Record<string, string>
) => Promise<TResponse>;

/**
 * PUT ハンドラー型
 */
export type RestPutHandler<TBody = unknown, TResponse = unknown> = (
  request: NextRequest,
  body: TBody,
  user?: UserEntity,
  params?: Record<string, string>
) => Promise<TResponse>;

/**
 * DELETE ハンドラー型
 */
export type RestDeleteHandler<T = unknown> = (
  request: NextRequest,
  user?: UserEntity,
  params?: Record<string, string>
) => Promise<T>;

/**
 * RESTハンドラーオプション
 */
export interface RestHandlerOptions {
  /** 認証が必要かどうか */
  requireAuth?: boolean;
  /** 管理者権限が必要かどうか */
  requireAdmin?: boolean;
  /** レート制限設定 */
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  /** バリデーションスキーマ */
  validationSchema?: (data: unknown) => boolean;
  /** 許可されたHTTPメソッド */
  allowedMethods?: readonly string[];
}

// ============================================================================
// RESTハンドラーファクトリー関数
// ============================================================================

/**
 * GET リクエストハンドラー作成
 */
export function createRestGetHandler<T>(
  handler: RestGetHandler<T>,
  options: RestHandlerOptions = {}
) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    // Next.js 15ではparamsをPromiseから解決
    const params = await context.params;

    try {
      // メソッドチェック
      if (options.allowedMethods) {
        const methodError = checkAllowedMethods(request.method, options.allowedMethods);
        if (methodError) return methodError;
      }

      // 認証チェック
      let user: UserEntity | undefined;

      if (options.requireAdmin) {
        const authResult = await requireAdminAuthorization();
        if (authResult instanceof NextResponse) return authResult;
        user = authResult;
      } else if (options.requireAuth) {
        const authResult = await requireAuthentication();
        if (authResult instanceof NextResponse) return authResult;
        user = authResult;
      }

      // ハンドラー実行
      const result = await handler(request, user, params);

      // 結果がレスポンス型の場合はそのまま返す
      if (result instanceof NextResponse) {
        return result;
      }

      // データレスポンス作成
      return createRestDataResponse(result, 'Request processed successfully');

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('GET handler error:', error);
      }
      return createRestErrorResponse(
        RestErrorCode.INTERNAL_ERROR,
        'Internal server error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  };
}

/**
 * POST リクエストハンドラー作成
 */
export function createRestPostHandler<TBody, TResponse>(
  handler: RestPostHandler<TBody, TResponse>,
  validator: (data: unknown) => data is TBody,
  options: RestHandlerOptions = {}
) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    // Next.js 15ではparamsをPromiseから解決
    const params = await context.params;

    try {
      // メソッドチェック
      if (options.allowedMethods) {
        const methodError = checkAllowedMethods(request.method, options.allowedMethods);
        if (methodError) return methodError;
      }

      // 認証チェック
      let user: UserEntity | undefined;

      if (options.requireAdmin) {
        const authResult = await requireAdminAuthorization();
        if (authResult instanceof NextResponse) return authResult;
        user = authResult;
      } else if (options.requireAuth) {
        const authResult = await requireAuthentication();
        if (authResult instanceof NextResponse) return authResult;
        user = authResult;
      }

      // リクエストボディ解析・検証
      const bodyResult = await parseRestRequestBody(request, validator);
      if (bodyResult instanceof NextResponse) return bodyResult;

      // ハンドラー実行
      const result = await handler(request, bodyResult, user, params);

      // 結果がレスポンス型の場合はそのまま返す
      if (result instanceof NextResponse) {
        return result;
      }

      // データレスポンス作成
      return createRestDataResponse(result, 'Resource created successfully', HttpStatus.CREATED);

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('POST handler error:', error);
      }
      return createRestErrorResponse(
        RestErrorCode.INTERNAL_ERROR,
        'Internal server error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  };
}

/**
 * PUT リクエストハンドラー作成
 */
export function createRestPutHandler<TBody, TResponse>(
  handler: RestPutHandler<TBody, TResponse>,
  validator: (data: unknown) => data is TBody,
  options: RestHandlerOptions = {}
) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    // Next.js 15ではparamsをPromiseから解決
    const params = await context.params;

    try {
      // メソッドチェック
      if (options.allowedMethods) {
        const methodError = checkAllowedMethods(request.method, options.allowedMethods);
        if (methodError) return methodError;
      }

      // 認証チェック
      let user: UserEntity | undefined;

      if (options.requireAdmin) {
        const authResult = await requireAdminAuthorization();
        if (authResult instanceof NextResponse) return authResult;
        user = authResult;
      } else if (options.requireAuth) {
        const authResult = await requireAuthentication();
        if (authResult instanceof NextResponse) return authResult;
        user = authResult;
      }

      // リクエストボディ解析・検証
      const bodyResult = await parseRestRequestBody(request, validator);
      if (bodyResult instanceof NextResponse) return bodyResult;

      // ハンドラー実行
      const result = await handler(request, bodyResult, user, params);

      // 結果がレスポンス型の場合はそのまま返す
      if (result instanceof NextResponse) {
        return result;
      }

      // データレスポンス作成
      return createRestDataResponse(result, 'Resource updated successfully');

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('PUT handler error:', error);
      }
      return createRestErrorResponse(
        RestErrorCode.INTERNAL_ERROR,
        'Internal server error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  };
}

/**
 * DELETE リクエストハンドラー作成
 */
export function createRestDeleteHandler<T>(
  handler: RestDeleteHandler<T>,
  options: RestHandlerOptions = {}
) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    // Next.js 15ではparamsをPromiseから解決
    const params = await context.params;

    try {
      // メソッドチェック
      if (options.allowedMethods) {
        const methodError = checkAllowedMethods(request.method, options.allowedMethods);
        if (methodError) return methodError;
      }

      // 認証チェック
      let user: UserEntity | undefined;

      if (options.requireAdmin) {
        const authResult = await requireAdminAuthorization();
        if (authResult instanceof NextResponse) return authResult;
        user = authResult;
      } else if (options.requireAuth) {
        const authResult = await requireAuthentication();
        if (authResult instanceof NextResponse) return authResult;
        user = authResult;
      }

      // ハンドラー実行
      const result = await handler(request, user, params);

      // 結果がレスポンス型の場合はそのまま返す
      if (result instanceof NextResponse) {
        return result;
      }

      // 削除成功レスポンス
      return new NextResponse(null, {
        status: HttpStatus.NO_CONTENT,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('DELETE handler error:', error);
      }
      return createRestErrorResponse(
        RestErrorCode.INTERNAL_ERROR,
        'Internal server error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  };
}

// ============================================================================
// CRUDハンドラー自動生成
// ============================================================================

/**
 * 完全なCRUDハンドラーセットを生成
 */
export function createCrudHandlers<TEntity, TCreateInput, TUpdateInput>(
  service: CrudService<TEntity, TCreateInput, TUpdateInput>,
  createValidator: (data: unknown) => data is TCreateInput,
  updateValidator: (data: unknown) => data is TUpdateInput,
  options: RestHandlerOptions = {}
) {
  const GET = createRestGetHandler(
    async (request) => {
      const { pagination, search, sorting, filters } = parseRestQueryParams(new URL(request.url).searchParams);

      const result = await service.getAll({
        ...filters,
        search,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to retrieve resources');
      }

      return createRestListResponse(
        result.data!.data,
        result.data!.pagination,
        'Resources retrieved successfully'
      );
    },
    options
  );

  const POST = createRestPostHandler(
    async (request, body) => {
      const result = await service.create(body);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create resource');
      }

      return result.data;
    },
    createValidator,
    { ...options, requireAuth: true }
  );

  const PUT = createRestPutHandler(
    async (request, body, user, params) => {
      if (!params?.id) {
        throw new Error('Resource ID is required');
      }

      const result = await service.update(params.id, body);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update resource');
      }

      return result.data;
    },
    updateValidator,
    { ...options, requireAuth: true }
  );

  const DELETE = createRestDeleteHandler(
    async (request, user, params) => {
      if (!params?.id) {
        throw new Error('Resource ID is required');
      }

      const result = await service.delete(params.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete resource');
      }

      return { success: true };
    },
    { ...options, requireAuth: true }
  );

  return { GET, POST, PUT, DELETE };
}

// ============================================================================
// エクスポート
// ============================================================================

export {
  createRestDataResponse, createRestErrorResponse, createRestListResponse, HttpStatus, parseRestQueryParams, parseRestRequestBody, RestErrorCode
};
