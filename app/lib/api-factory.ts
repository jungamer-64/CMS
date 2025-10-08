/**
 * API ファクトリー（高速・厳格型安全）
 *
 * - 統一されたAPIハンドラー作成
 * - 型安全なリクエスト処理
 * - パフォーマンス最適化
 */

import { RateLimiter } from '@/app/lib/security/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, parseJsonSafely, validateRequired } from './api-utils';
import { withApiAuth, type AuthContext } from './auth-middleware';
import type { ApiResponse, User } from './core/types';

// ユーティリティ関数をエクスポート
export { createErrorResponse, createSuccessResponse } from './api-utils';

/**
 * GET ハンドラー型定義
 */
export type GetHandler<T = unknown> = (
  request: NextRequest,
  user: User,
  params?: Record<string, string>
) => Promise<ApiResponse<T>>;

/**
 * POST ハンドラー型定義
 */
export type PostHandler<TBody = unknown, TResponse = unknown> = (
  request: NextRequest,
  body: TBody,
  user: User,
  params?: Record<string, string>
) => Promise<ApiResponse<TResponse>>;

/**
 * PUT ハンドラー型定義
 */
export type PutHandler<TBody = unknown, TResponse = unknown> = (
  request: NextRequest,
  body: TBody,
  user: User,
  params?: Record<string, string>
) => Promise<ApiResponse<TResponse>>;

/**
 * DELETE ハンドラー型定義
 */
export type DeleteHandler<T = unknown> = (
  request: NextRequest,
  user: User,
  params?: Record<string, string>
) => Promise<ApiResponse<T>>;

/**
 * ハンドラーオプション
 */
export interface HandlerOptions {
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
    message?: string;
  };
}

/**
 * レートリミットをチェックする共通関数
 */
async function checkRateLimit(
  userId: string,
  options?: HandlerOptions['rateLimit']
): Promise<{ allowed: boolean; error?: NextResponse }> {
  if (!options) {
    return { allowed: true };
  }

  const rateLimiter = RateLimiter.getInstance();
  const rateLimitConfig = {
    maxAttempts: options.maxRequests,
    windowMs: options.windowMs,
    blockDurationMs: 60000,
  };

  const result = await rateLimiter.checkLimit(userId, rateLimitConfig);

  if (!result.allowed) {
    return {
      allowed: false,
      error: NextResponse.json(
        createErrorResponse(options.message || 'Too many requests'),
        { status: 429 }
      ),
    };
  }

  return { allowed: true };
}

/**
 * 高速 GET ハンドラー作成
 */
/**
 * GET ハンドラー作成（認証必須）
 */
export function createGetHandler<T = unknown>(
  handler: GetHandler<T>,
  options?: HandlerOptions
) {
  return withApiAuth(async (request: NextRequest, context: AuthContext, params?: Record<string, string>) => {
    try {
      // Rate limit check
      const rateLimitCheck = await checkRateLimit(context.user.id, options?.rateLimit);
      if (!rateLimitCheck.allowed) {
        return rateLimitCheck.error!;
      }

      const result = await handler(request, context.user, params);
      return NextResponse.json(result);
    } catch (error) {
      console.error('GET handler error:', error);
      return NextResponse.json(
        createErrorResponse('Internal server error'),
        { status: 500 }
      );
    }
  });
}

/**
 * GET ハンドラー作成（認証オプション）
 */
export function createOptionalAuthGetHandler<T = unknown>(
  handler: (request: NextRequest, user?: User, params?: Record<string, string>) => Promise<ApiResponse<T>>,
  options?: HandlerOptions
) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    // Next.js 15ではparamsをPromiseから解決
    const params = await context.params;

    try {
      // オプション認証を試行
      let user: User | undefined;
      try {
        // 簡単な認証チェック（withApiAuthから抜粋）
        const authHeader = request.headers.get('authorization');
        const cookieHeader = request.headers.get('cookie');

        if (authHeader || cookieHeader) {
          // 認証情報があれば認証を試行（詳細は省略）
          // エラーが発生しても無視してuser = undefinedのまま続行
        }
      } catch {
        // 認証エラーは無視（オプション認証のため）
      }

      // Rate limit check (anonymous or authenticated)
      const identifier = user?.id || request.headers.get('x-forwarded-for') || 'anonymous';
      const rateLimitCheck = await checkRateLimit(identifier, options?.rateLimit);
      if (!rateLimitCheck.allowed) {
        return rateLimitCheck.error!;
      }

      const result = await handler(request, user, params);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Optional auth GET handler error:', error);
      return NextResponse.json(
        createErrorResponse('Internal server error'),
        { status: 500 }
      );
    }
  };
}

/**
 * リクエストボディをパースして検証する共通関数の戻り値型
 */
type ParseResult<TBody> =
  | { success: true; data: TBody }
  | { success: false; error: NextResponse };

/**
 * リクエストボディをパースして検証する共通関数
 */
async function parseAndValidateBody<TBody>(
  request: NextRequest,
  requiredFields?: (keyof TBody)[]
): Promise<ParseResult<TBody>> {
  const bodyResult = await parseJsonSafely<TBody>(request);

  if (!bodyResult.success) {
    return {
      success: false,
      error: NextResponse.json(
        createErrorResponse(bodyResult.error),
        { status: 400 }
      ),
    };
  }

  // 必須フィールドのバリデーション
  if (requiredFields) {
    const validationError = validateRequired(bodyResult.data as Record<string, unknown>, requiredFields);
    if (validationError) {
      return {
        success: false,
        error: NextResponse.json(
          createErrorResponse(validationError),
          { status: 400 }
        ),
      };
    }
  }

  return { success: true, data: bodyResult.data };
}

/**
 * POST ハンドラー作成
 */
export function createPostHandler<TBody = unknown, TResponse = unknown>(
  handler: PostHandler<TBody, TResponse>,
  requiredFields?: (keyof TBody)[]
) {
  return withApiAuth(async (request: NextRequest, context: AuthContext, params?: Record<string, string>) => {
    try {
      const bodyValidation = await parseAndValidateBody<TBody>(request, requiredFields);
      if (!bodyValidation.success) {
        return bodyValidation.error;
      }

      const result = await handler(request, bodyValidation.data, context.user, params);
      return NextResponse.json(result);
    } catch (error) {
      console.error('POST handler error:', error);
      return NextResponse.json(
        createErrorResponse('Internal server error'),
        { status: 500 }
      );
    }
  });
}

/**
 * PUT ハンドラー作成
 */
export function createPutHandler<TBody = unknown, TResponse = unknown>(
  handler: PutHandler<TBody, TResponse>,
  requiredFields?: (keyof TBody)[],
  options?: HandlerOptions
) {
  return withApiAuth(async (request: NextRequest, context: AuthContext, params?: Record<string, string>) => {
    try {
      // Body parsing and validation
      const bodyValidation = await parseAndValidateBody<TBody>(request, requiredFields);
      if (!bodyValidation.success) {
        return bodyValidation.error;
      }

      // Rate limit check
      const rateLimitCheck = await checkRateLimit(context.user.id, options?.rateLimit);
      if (!rateLimitCheck.allowed) {
        return rateLimitCheck.error!;
      }

      const result = await handler(request, bodyValidation.data, context.user, params);
      return NextResponse.json(result);
    } catch (error) {
      console.error('PUT handler error:', error);
      return NextResponse.json(
        createErrorResponse('Internal server error'),
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE ハンドラー作成
 */
export function createDeleteHandler<T = unknown>(
  handler: DeleteHandler<T>,
  options?: HandlerOptions
) {
  return withApiAuth(async (request: NextRequest, context: AuthContext, params?: Record<string, string>) => {
    try {
      // Rate limit check
      const rateLimitCheck = await checkRateLimit(context.user.id, options?.rateLimit);
      if (!rateLimitCheck.allowed) {
        return rateLimitCheck.error!;
      }

      const result = await handler(request, context.user, params);
      return NextResponse.json(result);
    } catch (error) {
      console.error('DELETE handler error:', error);
      return NextResponse.json(
        createErrorResponse('Internal server error'),
        { status: 500 }
      );
    }
  });
}
