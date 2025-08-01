import { NextRequest, NextResponse } from 'next/server';
import { 
  ApiErrorCode, 
  ValidationError, 
  AuthContext,
  RequiredPermission 
} from './api-types';
import { createErrorResponse } from './api-utils';

// =============================================================================
// APIエラーハンドラークラス
// =============================================================================

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string, 
    code: ApiErrorCode = ApiErrorCode.INTERNAL_ERROR, 
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationApiError extends ApiError {
  public readonly validationErrors: ValidationError[];

  constructor(validationErrors: ValidationError[]) {
    const message = validationErrors.map(e => e.message).join(', ');
    super(message, ApiErrorCode.VALIDATION_ERROR, 400);
    this.validationErrors = validationErrors;
  }
}

export class AuthenticationApiError extends ApiError {
  constructor(message: string = '認証が必要です') {
    super(message, ApiErrorCode.UNAUTHORIZED, 401);
  }
}

export class AuthorizationApiError extends ApiError {
  constructor(message: string = 'アクセスが拒否されました') {
    super(message, ApiErrorCode.FORBIDDEN, 403);
  }
}

export class NotFoundApiError extends ApiError {
  constructor(resource: string = 'リソース') {
    super(`${resource}が見つかりません`, ApiErrorCode.NOT_FOUND, 404);
  }
}

export class ConflictApiError extends ApiError {
  constructor(message: string = 'リソースが競合しています') {
    super(message, ApiErrorCode.CONFLICT, 409);
  }
}

export class RateLimitApiError extends ApiError {
  constructor(message: string = 'レート制限に達しました') {
    super(message, ApiErrorCode.RATE_LIMIT_EXCEEDED, 429);
  }
}

// =============================================================================
// グローバルエラーハンドラー
// =============================================================================

export function handleGlobalApiError(error: unknown): NextResponse {
  console.error('Global API Error:', error);

  // 独自のApiErrorの場合
  if (error instanceof ApiError) {
    return createErrorResponse(
      error.message,
      error.statusCode,
      error.code,
      error.details
    );
  }

  // バリデーションエラーの場合
  if (error instanceof ValidationApiError) {
    return createErrorResponse(
      error.message,
      error.statusCode,
      error.code,
      { validationErrors: error.validationErrors }
    );
  }

  // 標準のエラーオブジェクトの場合
  if (error instanceof Error) {
    // 既知のエラーパターンを検出
    if (error.message.includes('既に使用されています') || error.message.includes('already exists')) {
      return createErrorResponse(
        error.message,
        409,
        ApiErrorCode.ALREADY_EXISTS
      );
    }

    if (error.message.includes('見つかりません') || error.message.includes('not found')) {
      return createErrorResponse(
        error.message,
        404,
        ApiErrorCode.NOT_FOUND
      );
    }

    if (error.message.includes('認証') || error.message.includes('authentication')) {
      return createErrorResponse(
        error.message,
        401,
        ApiErrorCode.UNAUTHORIZED
      );
    }

    if (error.message.includes('権限') || error.message.includes('authorization')) {
      return createErrorResponse(
        error.message,
        403,
        ApiErrorCode.FORBIDDEN
      );
    }

    // その他のエラー
    return createErrorResponse(
      error.message,
      500,
      ApiErrorCode.INTERNAL_ERROR
    );
  }

  // 不明なエラー
  return createErrorResponse(
    'サーバー内部エラーが発生しました',
    500,
    ApiErrorCode.INTERNAL_ERROR
  );
}

// =============================================================================
// APIレスポンス標準化
// =============================================================================

export interface StandardApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: ApiErrorCode;
  message?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
    [key: string]: unknown;
  };
}

export function createStandardResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, unknown>
): StandardApiResponse<T> {
  return {
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}

export function createStandardErrorResponse(
  error: string,
  code?: ApiErrorCode,
  details?: Record<string, unknown>
): StandardApiResponse {
  return {
    success: false,
    error,
    code,
    meta: {
      timestamp: new Date().toISOString(),
      ...details
    }
  };
}

// =============================================================================
// 権限チェック用ユーティリティ
// =============================================================================

export function checkPermission(
  context: AuthContext,
  requiredPermission: RequiredPermission
): { allowed: boolean; reason?: string } {
  // 認証されていない場合
  if (!context.isAuthenticated) {
    return { allowed: false, reason: '認証が必要です' };
  }

  // セッション認証の場合
  if (context.authMethod === 'session' && context.user) {
    // 管理者は全ての権限を持つ
    if (context.user.role === 'admin') {
      return { allowed: true };
    }

    // 一般ユーザーの場合、基本的な権限チェック
    return checkBasicUserPermission(context.user.role, requiredPermission);
  }

  // APIキー認証の場合
  if (context.authMethod === 'apikey' && context.apiKey) {
    return checkApiKeyPermission(context.apiKey.permissions, requiredPermission);
  }

  return { allowed: false, reason: '有効な認証情報がありません' };
}

function checkBasicUserPermission(
  userRole: string,
  permission: RequiredPermission
): { allowed: boolean; reason?: string } {
  // 一般ユーザーの基本権限
  const basicPermissions: Record<string, string[]> = {
    posts: ['read'],
    comments: ['read', 'create'],
    settings: ['read'],
    uploads: ['create', 'read'],
    users: ['read']
  };

  const allowedActions = basicPermissions[permission.resource] || [];
  const allowed = allowedActions.includes(permission.action);

  return {
    allowed,
    reason: allowed ? undefined : `権限が不足しています: ${permission.resource}:${permission.action}`
  };
}

function checkApiKeyPermission(
  permissions: Record<string, Record<string, boolean>>,
  requiredPermission: RequiredPermission
): { allowed: boolean; reason?: string } {
  const resourcePermissions = permissions[requiredPermission.resource];
  
  if (!resourcePermissions) {
    return { 
      allowed: false, 
      reason: `リソース権限がありません: ${requiredPermission.resource}` 
    };
  }

  const hasPermission = resourcePermissions[requiredPermission.action];
  
  return {
    allowed: Boolean(hasPermission),
    reason: hasPermission ? undefined : 
      `アクション権限がありません: ${requiredPermission.resource}:${requiredPermission.action}`
  };
}

// =============================================================================
// リクエストコンテキスト管理
// =============================================================================

export interface RequestContext {
  requestId: string;
  timestamp: Date;
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  auth?: AuthContext;
}

export function createRequestContext(request: NextRequest): RequestContext {
  return {
    requestId: generateRequestId(),
    timestamp: new Date(),
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    method: request.method,
    path: new URL(request.url).pathname
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '127.0.0.1'
  );
}

// =============================================================================
// パフォーマンス監視
// =============================================================================

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
}

export function startPerformanceTracking(): PerformanceMetrics {
  return {
    startTime: performance.now(),
    memoryUsage: process.memoryUsage()
  };
}

export function endPerformanceTracking(metrics: PerformanceMetrics): PerformanceMetrics {
  const endTime = performance.now();
  return {
    ...metrics,
    endTime,
    duration: endTime - metrics.startTime
  };
}

// =============================================================================
// ログ管理
// =============================================================================

export interface ApiLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: RequestContext;
  error?: Error;
  data?: Record<string, unknown>;
  timestamp: Date;
}

export function logApiCall(
  level: ApiLog['level'],
  message: string,
  context?: RequestContext,
  error?: Error,
  data?: Record<string, unknown>
): void {
  const log: ApiLog = {
    level,
    message,
    context,
    error,
    data,
    timestamp: new Date()
  };

  // 本来はここで外部ログシステムに送信
  console.log(JSON.stringify(log, null, 2));
}
