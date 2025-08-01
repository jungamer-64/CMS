import { NextRequest, NextResponse } from 'next/server';
import { 
  ApiSuccess, 
  ApiError, 
  ApiErrorCode, 
  ValidationSchema, 
  ValidationResult, 
  ValidationError,
  ValidationRule,
  PaginationMeta
} from './api-types';

// レート制限用のメモリストア
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// =============================================================================
// 認証ミドルウェア
// =============================================================================

export interface AuthContext {
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string;
    role: 'user' | 'admin';
  };
}

export interface AuthOptions {
  resource?: string;
  action?: string;
  requireAdmin?: boolean;
}

// 動的インポートによる認証関数
async function validateUserSession(request: NextRequest) {
  const { validateUserSession: validate } = await import('./api-auth');
  return validate(request);
}

export interface AuthenticatedUser {
  id: string;
  userId?: string; // 後方互換性のため
  username: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}

export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser, context?: { params: Record<string, string> }) => Promise<NextResponse>,
  options: AuthOptions = {}
) {
  return async (
    request: NextRequest, 
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      const authResult = await validateUserSession(request);
      
      if (!authResult.valid || !authResult.user) {
        return createErrorResponse(
          authResult.error || '認証が必要です',
          401,
          ApiErrorCode.UNAUTHORIZED
        );
      }

      // 管理者権限が必要な場合
      if (options.requireAdmin && authResult.user.role !== 'admin') {
        return createErrorResponse(
          '管理者権限が必要です',
          403,
          ApiErrorCode.FORBIDDEN
        );
      }

      // パラメータがPromiseの場合は解決する
      const resolvedParams = await context.params;

      // ハンドラーに適切な引数を渡す
      return await handler(request, authResult.user, { params: resolvedParams });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// =============================================================================
// レート制限ミドルウェア
// =============================================================================

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  message?: string;
  keyGenerator?: (request: NextRequest) => string;
}

export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: RateLimitOptions
): (request: NextRequest) => Promise<NextResponse>;
export function withRateLimit(
  handler: (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>,
  options: RateLimitOptions
): (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>;
export function withRateLimit(
  handler: ((request: NextRequest) => Promise<NextResponse>) | ((request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>),
  options: RateLimitOptions
) {
  return async (
    request: NextRequest, 
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const key = options.keyGenerator ? options.keyGenerator(request) : getClientIP(request);
    const now = Date.now();
    
    // 古いエントリをクリーンアップ
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
    
    const current = rateLimitStore.get(key);
    
    if (!current || current.resetTime < now) {
      // 新しいエントリまたはリセット時間を過ぎた場合
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
    } else if (current.count >= options.maxRequests) {
      return createErrorResponse(
        options.message || 'レート制限に達しました',
        429,
        ApiErrorCode.RATE_LIMIT_EXCEEDED
      );
    } else {
      current.count++;
    }
    
    return context 
      ? await (handler as (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>)(request, context)
      : await (handler as (request: NextRequest) => Promise<NextResponse>)(request);
  };
}

// =============================================================================
// 統合認証ミドルウェア（認証 + 権限チェック）
// =============================================================================

export function withIntegratedAuth(
  handler: (request: NextRequest, authContext?: AuthContext) => Promise<NextResponse>,
  options: AuthOptions = {}
) {
  return async (
    request: NextRequest
  ): Promise<NextResponse> => {
    try {
      // 公開APIの場合は認証をスキップ
      if (options.resource === 'posts' && options.action === 'read') {
        return await handler(request);
      }

      const authResult = await validateUserSession(request);
      
      if (!authResult.valid || !authResult.user) {
        return createErrorResponse(
          authResult.error || '認証が必要です',
          401,
          ApiErrorCode.UNAUTHORIZED
        );
      }

      // 管理者権限が必要な場合
      if (options.requireAdmin && authResult.user.role !== 'admin') {
        return createErrorResponse(
          '管理者権限が必要です',
          403,
          ApiErrorCode.FORBIDDEN
        );
      }

      const authContext: AuthContext = { 
        user: {
          id: authResult.user.id,
          username: authResult.user.username,
          email: authResult.user.email || '',
          displayName: authResult.user.displayName || authResult.user.username,
          role: authResult.user.role
        }
      };
      return await handler(request, authContext);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

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

function validateField(field: string, value: unknown, rule: ValidationRule): ValidationError[] {
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
    if (typeof result === 'string') {
      errors.push({
        field,
        message: result,
        code: ApiErrorCode.INVALID_FORMAT
      });
    } else if (result === false) {
      errors.push({
        field,
        message: `${field}のバリデーションに失敗しました`,
        code: ApiErrorCode.VALIDATION_ERROR
      });
    }
  }

  return errors;
}

function validateStringField(field: string, value: string, rule: ValidationRule): ValidationError[] {
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

function validateNumberField(field: string, value: number, rule: ValidationRule): ValidationError[] {
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

// =============================
// ファイルサイズ変換ユーティリティ
// =============================
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
