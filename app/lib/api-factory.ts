import { NextRequest, NextResponse } from 'next/server';
import {
  ApiResponse,
  ApiErrorCode,
  ValidationSchema,
  createApiSuccess,
  createApiError
} from './api-types';
import {
  withAuth,
  withRateLimit,
  createSuccessResponse,
  createErrorResponse,
  validateData,
  handleApiError,
  AuthOptions,
  AuthenticatedUser,
  RateLimitOptions
} from './api-utils';

// =============================================================================
// 共通APIハンドラーファクトリー
// =============================================================================

/**
 * APIハンドラー設定オプション
 */
export interface ApiHandlerOptions {
  /** 認証が必要かどうか */
  requireAuth?: boolean;
  /** 管理者権限が必要かどうか */
  requireAdmin?: boolean;
  /** レート制限設定 */
  rateLimit?: RateLimitOptions;
  /** バリデーションスキーマ */
  validationSchema?: ValidationSchema<Record<string, unknown>>;
}

/**
 * 型安全なAPIレスポンスハンドラー
 */
export type ApiHandler<TRequest = unknown, TResponse = unknown> = (
  request: NextRequest,
  body: TRequest,
  user?: AuthenticatedUser,
  params?: Record<string, string>
) => Promise<ApiResponse<TResponse>>;

/**
 * 公開APIレスポンスハンドラー
 */
export type PublicApiHandler<TRequest = unknown, TResponse = unknown> = (
  request: NextRequest,
  body: TRequest,
  params?: Record<string, string>
) => Promise<ApiResponse<TResponse>>;

/**
 * 型安全なAPIハンドラーを作成
 */
export function createApiHandler<TRequest = unknown, TResponse = unknown>(
  handler: ApiHandler<TRequest, TResponse>,
  options: ApiHandlerOptions = {}
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      // パラメータの解決（キャッシュして再利用）
      const resolvedParams = await context.params;

      // 認証が不要な場合
      if (!options.requireAuth) {
        return handlePublicRequest(request, handler, resolvedParams, options);
      }

      // 認証が必要な場合
      return handleAuthenticatedRequest(request, handler, resolvedParams, options);
    } catch (error) {
      console.error('API Handler Error:', error);
      return handleApiError(error);
    }
  };
}

/**
 * 公開APIハンドラーを作成
 */
export function createPublicApiHandler<TRequest = unknown, TResponse = unknown>(
  handler: PublicApiHandler<TRequest, TResponse>,
  options: Omit<ApiHandlerOptions, 'requireAuth' | 'requireAdmin'> = {}
) {
  const publicHandler: ApiHandler<TRequest, TResponse> = async (request, body, user, params) => {
    return handler(request, body, params);
  };

  return createApiHandler(publicHandler, {
    ...options,
    requireAuth: false,
    requireAdmin: false
  });
}

/**
 * 管理者専用APIハンドラーを作成
 */
export function createAdminApiHandler<TRequest = unknown, TResponse = unknown>(
  handler: ApiHandler<TRequest, TResponse>,
  options: Omit<ApiHandlerOptions, 'requireAuth' | 'requireAdmin'> = {}
) {
  return createApiHandler(handler, {
    ...options,
    requireAuth: true,
    requireAdmin: true
  });
}

// =============================================================================
// 内部ヘルパー関数
// =============================================================================

/**
 * リクエストボディを安全に取得
 */
async function getRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch {
    // JSONパースに失敗した場合は空オブジェクトを返す
    return {} as T;
  }
}

/**
 * バリデーションを実行
 */
function validateRequestBody<T extends Record<string, unknown>>(
  body: T,
  schema?: ValidationSchema<T>
): NextResponse | null {
  if (!schema || !body) return null;
  
  const validation = validateData(body, schema);
  if (!validation.isValid) {
    return createErrorResponse(
      validation.errors.map(e => e.message).join(', '),
      400,
      ApiErrorCode.VALIDATION_ERROR
    );
  }
  return null;
}

/**
 * 公開リクエストを処理
 */
async function handlePublicRequest<TRequest = unknown, TResponse = unknown>(
  request: NextRequest,
  handler: ApiHandler<TRequest, TResponse>,
  params: Record<string, string>,
  options: ApiHandlerOptions
): Promise<NextResponse> {
  // リクエストボディの取得
  const body = await getRequestBody<TRequest>(request);

  // バリデーション
  const validationError = validateRequestBody(
    body as Record<string, unknown>, 
    options.validationSchema
  );
  if (validationError) return validationError;

  // レート制限の適用
  if (options.rateLimit) {
    const wrappedHandler = withRateLimit(
      async (req: NextRequest) => {
        const result = await handler(req, body, undefined, params);
        return convertApiResponseToNextResponse(result);
      },
      options.rateLimit
    );
    return wrappedHandler(request);
  }

  // ハンドラー実行
  const result = await handler(request, body, undefined, params);
  return convertApiResponseToNextResponse(result);
}

/**
 * 認証済みリクエストを処理
 */
function handleAuthenticatedRequest<TRequest = unknown, TResponse = unknown>(
  request: NextRequest,
  handler: ApiHandler<TRequest, TResponse>,
  params: Record<string, string>,
  options: ApiHandlerOptions
): Promise<NextResponse> {
  const authOptions: AuthOptions = {
    requireAdmin: options.requireAdmin
  };

  const wrappedHandler = async (
    req: NextRequest,
    user: AuthenticatedUser,
    context?: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      // リクエストボディの取得
      const body = await getRequestBody<TRequest>(req);

      // バリデーション
      const validationError = validateRequestBody(
        body as Record<string, unknown>, 
        options.validationSchema
      );
      if (validationError) return validationError;

      // ハンドラー実行
      const result = await handler(req, body, user, context?.params);
      return convertApiResponseToNextResponse(result);
    } catch (error) {
      console.error('Authenticated Handler Error:', error);
      return handleApiError(error);
    }
  };

  // レート制限の適用
  if (options.rateLimit) {
    return withRateLimit(
      withAuth(wrappedHandler, authOptions),
      options.rateLimit
    )(request, { params: Promise.resolve(params) });
  }

  return withAuth(wrappedHandler, authOptions)(request, { params: Promise.resolve(params) });
}

/**
 * ApiResponseをNextResponseに変換
 */
function convertApiResponseToNextResponse<T>(
  apiResponse: ApiResponse<T>
): NextResponse {
  if (apiResponse.success) {
    return createSuccessResponse(
      apiResponse.data,
      apiResponse.message,
      apiResponse.meta
    );
  } else {
    return createErrorResponse(
      apiResponse.error,
      getStatusFromErrorCode(apiResponse.code),
      apiResponse.code,
      apiResponse.details
    );
  }
}

/**
 * エラーコードからHTTPステータスコードを取得
 */
function getStatusFromErrorCode(code?: ApiErrorCode): number {
  switch (code) {
    case ApiErrorCode.UNAUTHORIZED:
      return 401;
    case ApiErrorCode.FORBIDDEN:
      return 403;
    case ApiErrorCode.NOT_FOUND:
      return 404;
    case ApiErrorCode.ALREADY_EXISTS:
    case ApiErrorCode.CONFLICT:
      return 409;
    case ApiErrorCode.VALIDATION_ERROR:
    case ApiErrorCode.MISSING_REQUIRED_FIELD:
    case ApiErrorCode.INVALID_FORMAT:
      return 400;
    case ApiErrorCode.RATE_LIMIT_EXCEEDED:
      return 429;
    case ApiErrorCode.INTERNAL_ERROR:
    case ApiErrorCode.DATABASE_ERROR:
    case ApiErrorCode.EXTERNAL_SERVICE_ERROR:
      return 500;
    default:
      return 400;
  }
}

// =============================================================================
// よく使用されるHTTPメソッド用のヘルパー関数
// =============================================================================

/**
 * HTTPメソッド用の共通ハンドラーファクトリー
 */
function createHttpMethodHandler<TRequest = unknown, TResponse = unknown>(
  handler: (
    request: NextRequest,
    body: TRequest,
    user?: AuthenticatedUser,
    params?: Record<string, string>
  ) => Promise<ApiResponse<TResponse>>,
  options: ApiHandlerOptions = {}
) {
  const apiHandler: ApiHandler<TRequest, TResponse> = async (request, body, user, params) => {
    return handler(request, body, user, params);
  };

  return createApiHandler(apiHandler, options);
}

/**
 * GETエンドポイント用のハンドラーを作成
 */
export function createGetHandler<TResponse = unknown>(
  handler: (
    request: NextRequest,
    user?: AuthenticatedUser,
    params?: Record<string, string>
  ) => Promise<ApiResponse<TResponse>>,
  options: ApiHandlerOptions = {}
) {
  const apiHandler: ApiHandler<void, TResponse> = async (request, _body, user, params) => {
    return handler(request, user, params);
  };

  return createApiHandler(apiHandler, options);
}

/**
 * POSTエンドポイント用のハンドラーを作成
 */
export function createPostHandler<TRequest = unknown, TResponse = unknown>(
  handler: (
    request: NextRequest,
    body: TRequest,
    user?: AuthenticatedUser,
    params?: Record<string, string>
  ) => Promise<ApiResponse<TResponse>>,
  options: ApiHandlerOptions = {}
) {
  return createHttpMethodHandler(handler, options);
}

/**
 * PUTエンドポイント用のハンドラーを作成
 */
export function createPutHandler<TRequest = unknown, TResponse = unknown>(
  handler: (
    request: NextRequest,
    body: TRequest,
    user?: AuthenticatedUser,
    params?: Record<string, string>
  ) => Promise<ApiResponse<TResponse>>,
  options: ApiHandlerOptions = {}
) {
  return createHttpMethodHandler(handler, options);
}

/**
 * PATCHエンドポイント用のハンドラーを作成
 */
export function createPatchHandler<TRequest = unknown, TResponse = unknown>(
  handler: (
    request: NextRequest,
    body: TRequest,
    user?: AuthenticatedUser,
    params?: Record<string, string>
  ) => Promise<ApiResponse<TResponse>>,
  options: ApiHandlerOptions = {}
) {
  return createHttpMethodHandler(handler, options);
}

/**
 * DELETEエンドポイント用のハンドラーを作成
 */
export function createDeleteHandler<TResponse = unknown>(
  handler: (
    request: NextRequest,
    user?: AuthenticatedUser,
    params?: Record<string, string>
  ) => Promise<ApiResponse<TResponse>>,
  options: ApiHandlerOptions = {}
) {
  const apiHandler: ApiHandler<unknown, TResponse> = async (request, _body, user, params) => {
    return handler(request, user, params);
  };

  return createApiHandler(apiHandler, options);
}

// =============================================================================
// CRUD操作用のジェネリックファクトリー
// =============================================================================

/**
 * CRUDエンティティの型定義
 */
export interface CrudEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * CRUD操作のサービス層インターフェース
 */
export interface CrudService<TEntity extends CrudEntity, TCreateRequest, TUpdateRequest> {
  getAll(filters?: Record<string, unknown>): Promise<TEntity[]>;
  getById(id: string): Promise<TEntity | null>;
  create(data: TCreateRequest): Promise<TEntity>;
  update(id: string, data: TUpdateRequest): Promise<TEntity | null>;
  delete(id: string): Promise<boolean>;
}

/**
 * CRUD操作の共通エラーハンドリング
 */
function handleCrudError(error: unknown, operation: string): ApiResponse<never> {
  console.error(`CRUD ${operation} error:`, error);
  return createApiError(
    error instanceof Error ? error.message : `${operation}に失敗しました`,
    ApiErrorCode.INTERNAL_ERROR
  );
}

/**
 * IDパラメータの検証
 */
function validateIdParam(params?: Record<string, string>): string | ApiResponse<never> {
  const id = params?.id;
  if (!id) {
    return createApiError('IDが必要です', ApiErrorCode.MISSING_REQUIRED_FIELD);
  }
  return id;
}

/**
 * CRUD APIハンドラーを作成
 */
export function createCrudHandlers<
  TEntity extends CrudEntity,
  TCreateRequest,
  TUpdateRequest
>(
  service: CrudService<TEntity, TCreateRequest, TUpdateRequest>,
  options: {
    createSchema?: ValidationSchema<Record<string, unknown>>;
    updateSchema?: ValidationSchema<Record<string, unknown>>;
    requireAuth?: boolean;
    requireAdmin?: boolean;
    rateLimit?: RateLimitOptions;
  } = {}
) {
  const baseOptions: ApiHandlerOptions = {
    requireAuth: options.requireAuth ?? true,
    requireAdmin: options.requireAdmin ?? false,
    rateLimit: options.rateLimit
  };

  return {
    // 一覧取得
    GET: createGetHandler<TEntity[]>(
      async (request) => {
        try {
          const { searchParams } = new URL(request.url);
          const filters: Record<string, unknown> = {};
          
          // URLパラメータをフィルターに変換
          for (const [key, value] of searchParams.entries()) {
            filters[key] = value;
          }

          const entities = await service.getAll(filters);
          return createApiSuccess(entities);
        } catch (error) {
          return handleCrudError(error, '取得');
        }
      },
      baseOptions
    ),

    // 新規作成
    POST: createPostHandler<TCreateRequest, TEntity>(
      async (request, body) => {
        try {
          const entity = await service.create(body);
          return createApiSuccess(entity, '正常に作成されました');
        } catch (error) {
          return handleCrudError(error, '作成');
        }
      },
      {
        ...baseOptions,
        validationSchema: options.createSchema
      }
    ),

    // 個別取得
    getById: createGetHandler<TEntity>(
      async (request, user, params) => {
        try {
          const idOrError = validateIdParam(params);
          if (typeof idOrError !== 'string') return idOrError;

          const entity = await service.getById(idOrError);
          if (!entity) {
            return createApiError('データが見つかりません', ApiErrorCode.NOT_FOUND);
          }

          return createApiSuccess(entity);
        } catch (error) {
          return handleCrudError(error, '取得');
        }
      },
      baseOptions
    ),

    // 更新
    update: createPutHandler<TUpdateRequest, TEntity>(
      async (request, body, user, params) => {
        try {
          const idOrError = validateIdParam(params);
          if (typeof idOrError !== 'string') return idOrError;

          const entity = await service.update(idOrError, body);
          if (!entity) {
            return createApiError('データが見つかりません', ApiErrorCode.NOT_FOUND);
          }

          return createApiSuccess(entity, '正常に更新されました');
        } catch (error) {
          return handleCrudError(error, '更新');
        }
      },
      {
        ...baseOptions,
        validationSchema: options.updateSchema
      }
    ),

    // 削除
    deleteById: createDeleteHandler<{ success: boolean }>(
      async (request, user, params) => {
        try {
          const idOrError = validateIdParam(params);
          if (typeof idOrError !== 'string') return idOrError;

          const success = await service.delete(idOrError);
          if (!success) {
            return createApiError('データが見つかりません', ApiErrorCode.NOT_FOUND);
          }

          return createApiSuccess({ success }, '正常に削除されました');
        } catch (error) {
          return handleCrudError(error, '削除');
        }
      },
      baseOptions
    )
  };
}
