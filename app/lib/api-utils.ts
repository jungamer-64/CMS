import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { 
  ApiSuccess, 
  ApiError, 
  ApiErrorCode, 
  AuthenticatedUser, 
  AuthContext, 
  ValidationSchema, 
  ValidationResult, 
  ValidationError,
  RequiredPermission,
  RateLimitConfig,
  PaginationMeta
} from './api-types';
import { validateApiKey, validateUserSession, checkRateLimit } from './api-auth';

// =============================================================================
// レスポンス作成ユーティリティ
// =============================================================================

export function createSuccessResponse<T>(
  data: T, 
  message?: string,
  meta?: Partial<ApiSuccess<T>['meta']>
): NextResponse {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { 
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    })
  };
  
  return NextResponse.json(response);
}

export function createErrorResponse(
  error: string, 
  status: number = 400,
  code?: ApiErrorCode,
  details?: Record<string, unknown>
): NextResponse {
  const response: ApiError = {
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details })
  };
  
  return NextResponse.json(response, { status });
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  message?: string
): NextResponse {
  return createSuccessResponse(
    data,
    message,
    { pagination }
  );
}

// =============================================================================
// 認証・認可ユーティリティ
// =============================================================================

export function verifyAdminToken(request: NextRequest): AuthenticatedUser | null {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
      userId: string;
      username: string;
      role: string;
    };

    if (decoded.role !== 'admin') {
      return null;
    }

    return {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role as 'user' | 'admin'
    };
  } catch {
    return null;
  }
}

// 統合認証（セッション + APIキー対応）
export async function authenticateRequest(
  request: NextRequest,
  requiredPermission?: RequiredPermission
): Promise<{ success: boolean; context?: AuthContext; error?: string }> {
  // 1. セッション認証を試行
  const sessionValidation = await validateUserSession(request);
  
  if (sessionValidation.valid && sessionValidation.user) {
    const context: AuthContext = {
      isAuthenticated: true,
      authMethod: 'session',
      user: {
        userId: sessionValidation.user.id,
        username: sessionValidation.user.username,
        role: sessionValidation.user.role,
        email: sessionValidation.user.email,
        displayName: sessionValidation.user.displayName
      }
    };

    // 管理者は全ての権限を持つ
    if (context.user?.role === 'admin') {
      return { success: true, context };
    }

    return { success: true, context };
  }

  // 2. APIキー認証を試行
  const apiKeyValidation = await validateApiKey(request, requiredPermission);
  
  if (apiKeyValidation.valid) {
    const context: AuthContext = {
      isAuthenticated: true,
      authMethod: 'apikey',
      apiKey: {
        userId: apiKeyValidation.userId!,
        permissions: apiKeyValidation.permissions!
      }
    };

    return { success: true, context };
  }

  return {
    success: false,
    error: sessionValidation.error || apiKeyValidation.error || '認証が必要です'
  };
}

// =============================================================================
// 認証付きAPIハンドラーラッパー
// =============================================================================

export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = verifyAdminToken(request);
      
      if (!user) {
        return createErrorResponse(
          '管理者権限が必要です', 
          403, 
          ApiErrorCode.FORBIDDEN
        );
      }

      return await handler(request, user, ...args);
    } catch (error) {
      console.error('API Error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'サーバーエラーが発生しました',
        500,
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  };
}

// 統合認証付きAPIハンドラーラッパー
export function withIntegratedAuth<T extends unknown[]>(
  handler: (request: NextRequest, context: AuthContext, ...args: T) => Promise<NextResponse>,
  requiredPermission?: RequiredPermission
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authResult = await authenticateRequest(request, requiredPermission);
      
      if (!authResult.success) {
        return createErrorResponse(
          authResult.error || '認証が必要です', 
          401, 
          ApiErrorCode.UNAUTHORIZED
        );
      }

      return await handler(request, authResult.context!, ...args);
    } catch (error) {
      console.error('API Error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'サーバーエラーが発生しました',
        500,
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  };
}

// レート制限付きAPIハンドラーラッパー
export function withRateLimit<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const ip = getClientIP(request);
      const rateLimitResult = checkRateLimit(ip, config.maxRequests, config.windowMs);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          config.message || 'レート制限に達しました',
          429,
          ApiErrorCode.RATE_LIMIT_EXCEEDED
        );
      }

      return await handler(request, ...args);
    } catch (error) {
      console.error('API Error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'サーバーエラーが発生しました',
        500,
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  };
}

// =============================================================================
// バリデーションユーティリティ
// =============================================================================

export function validateRequired(data: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    const value = data[field];
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      return `${field}は必須です`;
    }
  }
  return null;
}

export function validateData<T extends Record<string, unknown>>(
  data: T,
  schema: ValidationSchema<T>
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, rule] of Object.entries(schema)) {
    if (!rule) continue;

    const fieldErrors = validateField(field, data[field], rule);
    errors.push(...fieldErrors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateField(field: string, value: unknown, rule: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // 必須チェック
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push({
      field,
      message: `${field}は必須です`,
      code: ApiErrorCode.MISSING_REQUIRED_FIELD
    });
    return errors; // 必須項目が不足している場合は他のチェックをスキップ
  }

  // 値が存在しない場合はスキップ
  if (value === undefined || value === null) {
    return errors;
  }

  // 型チェック
  if (rule.type && !validateType(value, rule.type)) {
    errors.push({
      field,
      message: `${field}の型が正しくありません`,
      code: ApiErrorCode.INVALID_FORMAT
    });
    return errors; // 型が間違っている場合は他のチェックをスキップ
  }

  // 文字列長チェック
  if (typeof value === 'string') {
    errors.push(...validateStringField(field, value, rule));
  }

  // 数値範囲チェック
  if (typeof value === 'number') {
    errors.push(...validateNumberField(field, value, rule));
  }

  // パターンチェック
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    errors.push({
      field,
      message: `${field}の形式が正しくありません`,
      code: ApiErrorCode.INVALID_FORMAT
    });
  }

  // カスタムバリデーション
  if (rule.custom) {
    const result = rule.custom(value);
    if (result !== true) {
      errors.push({
        field,
        message: typeof result === 'string' ? result : `${field}のバリデーションに失敗しました`,
        code: ApiErrorCode.VALIDATION_ERROR
      });
    }
  }

  return errors;
}

function validateStringField(field: string, value: string, rule: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (rule.minLength && value.length < rule.minLength) {
    errors.push({
      field,
      message: `${field}は${rule.minLength}文字以上で入力してください`,
      code: ApiErrorCode.VALIDATION_ERROR
    });
  }

  if (rule.maxLength && value.length > rule.maxLength) {
    errors.push({
      field,
      message: `${field}は${rule.maxLength}文字以下で入力してください`,
      code: ApiErrorCode.VALIDATION_ERROR
    });
  }

  return errors;
}

function validateNumberField(field: string, value: number, rule: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (rule.min !== undefined && value < rule.min) {
    errors.push({
      field,
      message: `${field}は${rule.min}以上で入力してください`,
      code: ApiErrorCode.VALIDATION_ERROR
    });
  }

  if (rule.max !== undefined && value > rule.max) {
    errors.push({
      field,
      message: `${field}は${rule.max}以下で入力してください`,
      code: ApiErrorCode.VALIDATION_ERROR
    });
  }

  return errors;
}

function validateType(value: unknown, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'email':
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'url':
      try {
        new URL(value as string);
        return true;
      } catch {
        return false;
      }
    default:
      return true;
  }
}

// =============================================================================
// ユーティリティ関数
// =============================================================================

export async function getParams<T extends Record<string, string>>(
  params: Promise<T>
): Promise<T> {
  return await params;
}

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '127.0.0.1'
  );
}

export function parseSearchParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return Object.fromEntries(searchParams.entries());
}

export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  
  return { page, limit, skip: (page - 1) * limit };
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

// =============================================================================
// エラーハンドリング
// =============================================================================

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    // 既知のエラーパターンをチェック
    if (error.message.includes('既に使用されています')) {
      return createErrorResponse(
        error.message, 
        409, 
        ApiErrorCode.ALREADY_EXISTS
      );
    }
    
    if (error.message.includes('見つかりません')) {
      return createErrorResponse(
        error.message, 
        404, 
        ApiErrorCode.NOT_FOUND
      );
    }

    return createErrorResponse(
      error.message, 
      500, 
      ApiErrorCode.INTERNAL_ERROR
    );
  }

  return createErrorResponse(
    'サーバーエラーが発生しました', 
    500, 
    ApiErrorCode.INTERNAL_ERROR
  );
}
