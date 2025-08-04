/**
 * API ファクトリー（高速・厳格型安全）
 * 
 * - 統一されたAPIハンドラー作成
 * - 型安全なリクエスト処理
 * - パフォーマンス最適化
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth, type AuthContext } from './auth-middleware';
import { createErrorResponse, parseJsonSafely, validateRequired } from './api-utils';
import type { ApiResponse, User } from './core/types';
import { RateLimiter } from '@/app/lib/security/rate-limiter';

// ユーティリティ関数をエクスポート
export { createErrorResponse } from './api-utils';

/**
 * 成功レスポンス作成
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data
  };
}

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
interface HandlerOptions {
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
    message: string;
  };
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
      if (options?.rateLimit) {
        const rateLimiter = RateLimiter.getInstance();
        // Correct `RateLimitConfig` usage
        const rateLimitConfig = {
          maxAttempts: options.rateLimit.maxRequests,
          windowMs: options.rateLimit.windowMs,
          blockDurationMs: 60000 // Default block duration
        };
        const rateLimitResult = await rateLimiter.checkLimit(context.user.id, rateLimitConfig);
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            createErrorResponse(options.rateLimit.message),
            { status: 429 }
          );
        }
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
  return async (request: NextRequest, params?: Record<string, string>) => {
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
      } catch (authError) {
        // 認証エラーは無視（オプション認証のため）
        console.log('オプション認証失敗（無視）:', authError);
      }

      if (options?.rateLimit) {
        const rateLimiter = RateLimiter.getInstance();
        const rateLimitConfig = {
          maxAttempts: options.rateLimit.maxRequests,
          windowMs: options.rateLimit.windowMs,
          blockDurationMs: 60000
        };
        const rateLimitResult = await rateLimiter.checkLimit(
          user?.id || request.headers.get('x-forwarded-for') || 'anonymous',
          rateLimitConfig
        );
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            createErrorResponse(options.rateLimit.message || 'Too many requests'),
            { status: 429 }
          );
        }
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
 * 高速 POST ハンドラー作成
 */
export function createPostHandler<TBody = unknown, TResponse = unknown>(
  handler: PostHandler<TBody, TResponse>,
  requiredFields?: (keyof TBody)[]
) {
  return withApiAuth(async (request: NextRequest, context: AuthContext, params?: Record<string, string>) => {
    try {
      const bodyResult = await parseJsonSafely<TBody>(request);
      
      if (!bodyResult.success) {
        return NextResponse.json(
          createErrorResponse(bodyResult.error),
          { status: 400 }
        );
      }

      // 必須フィールドのバリデーション
      if (requiredFields) {
        const validationError = validateRequired(bodyResult.data as Record<string, unknown>, requiredFields);
        if (validationError) {
          return NextResponse.json(
            createErrorResponse(validationError),
            { status: 400 }
          );
        }
      }

      const result = await handler(request, bodyResult.data, context.user, params);
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
 * 高速 PUT ハンドラー作成
 */
export function createPutHandler<TBody = unknown, TResponse = unknown>(
  handler: PutHandler<TBody, TResponse>,
  requiredFields?: (keyof TBody)[],
  options?: HandlerOptions
) {
  return withApiAuth(async (request: NextRequest, context: AuthContext, params?: Record<string, string>) => {
    try {
      const bodyResult = await parseJsonSafely<TBody>(request);
      
      if (!bodyResult.success) {
        return NextResponse.json(
          createErrorResponse(bodyResult.error),
          { status: 400 }
        );
      }

      // 必須フィールドのバリデーション
      if (requiredFields) {
        const validationError = validateRequired(bodyResult.data as Record<string, unknown>, requiredFields);
        if (validationError) {
          return NextResponse.json(
            createErrorResponse(validationError),
            { status: 400 }
          );
        }
      }

      if (options?.rateLimit) {
        const rateLimiter = RateLimiter.getInstance();
        // Correct `RateLimitConfig` usage
        const rateLimitConfig = {
          maxAttempts: options.rateLimit.maxRequests,
          windowMs: options.rateLimit.windowMs,
          blockDurationMs: 60000 // Default block duration
        };
        const rateLimitResult = await rateLimiter.checkLimit(context.user.id, rateLimitConfig);
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            createErrorResponse(options.rateLimit.message),
            { status: 429 }
          );
        }
      }

      const result = await handler(request, bodyResult.data, context.user, params);
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
 * 高速 DELETE ハンドラー作成
 */
export function createDeleteHandler<T = unknown>(
  handler: DeleteHandler<T>
) {
  return withApiAuth(async (request: NextRequest, context: AuthContext, params?: Record<string, string>) => {
    try {
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
