/**
 * 統一エラーハンドリングシステム
 *
 * 目的:
 * - アプリケーション全体で一貫したエラー処理
 * - APIエラー、クライアントエラー、サーバーエラーの統一的な管理
 * - ロギングとモニタリングの統合ポイント
 *
 * 使用例:
 * ```typescript
 * // APIルート内
 * try {
 *   const result = await dangerousOperation();
 *   return handleSuccess(result);
 * } catch (error) {
 *   return handleApiError(error, { route: '/api/posts' });
 * }
 *
 * // クライアントコンポーネント内
 * try {
 *   await fetchData();
 * } catch (error) {
 *   const handledError = handleClientError(error, { component: 'Comments' });
 *   setErrorMessage(handledError.message);
 * }
 * ```
 */

import { NextResponse } from 'next/server';
import { ApiErrorCode } from './types';
import type { ApiError, ApiSuccess } from './types';

/**
 * エラーコンテキスト - エラー発生時の追加情報
 */
export interface ErrorContext {
  /** エラー発生場所 (例: '/api/posts', 'Comments.tsx') */
  location?: string;
  /** ユーザーID (認証済みの場合) */
  userId?: string;
  /** リクエストID (トレーシング用) */
  requestId?: string;
  /** 追加のメタデータ */
  metadata?: Record<string, unknown>;
}

/**
 * ハンドルされたエラー - 統一されたエラー情報
 */
export interface HandledError {
  /** エラーメッセージ (ユーザー向け) */
  message: string;
  /** エラーコード */
  code: ApiErrorCode;
  /** HTTPステータスコード */
  statusCode: number;
  /** 詳細情報 (開発者向け) */
  details?: Record<string, unknown>;
  /** 元のエラー (デバッグ用) */
  originalError?: unknown;
}

/**
 * エラーの重要度レベル
 */
export enum ErrorSeverity {
  /** 致命的なエラー - システムの動作に重大な影響 */
  CRITICAL = 'critical',
  /** エラー - 機能の実行失敗 */
  ERROR = 'error',
  /** 警告 - 問題があるが動作は継続 */
  WARNING = 'warning',
  /** 情報 - エラーではないが記録が必要 */
  INFO = 'info',
}

/**
 * エラーをApiErrorCodeとHTTPステータスコードにマッピング
 */
function mapErrorToCode(error: unknown): { code: ApiErrorCode; statusCode: number } {
  // カスタムエラークラスの場合
  if (error && typeof error === 'object' && 'code' in error && 'statusCode' in error) {
    return {
      code: (error.code as ApiErrorCode) || ApiErrorCode.INTERNAL_ERROR,
      statusCode: (error.statusCode as number) || 500,
    };
  }

  // 標準エラーメッセージから推測
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('認証')) {
      return { code: ApiErrorCode.UNAUTHORIZED, statusCode: 401 };
    }
    if (message.includes('forbidden') || message.includes('権限')) {
      return { code: ApiErrorCode.FORBIDDEN, statusCode: 403 };
    }
    if (message.includes('not found') || message.includes('見つかりません')) {
      return { code: ApiErrorCode.NOT_FOUND, statusCode: 404 };
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('検証')) {
      return { code: ApiErrorCode.VALIDATION_ERROR, statusCode: 400 };
    }
    if (message.includes('rate limit') || message.includes('制限')) {
      return { code: ApiErrorCode.RATE_LIMIT_EXCEEDED, statusCode: 429 };
    }
  }

  // デフォルト: 内部エラー
  return { code: ApiErrorCode.INTERNAL_ERROR, statusCode: 500 };
}

/**
 * エラーをHandledError形式に変換
 */
function normalizeError(error: unknown, context?: ErrorContext): HandledError {
  const { code, statusCode } = mapErrorToCode(error);

  // Error インスタンスの場合
  if (error instanceof Error) {
    return {
      message: error.message,
      code,
      statusCode,
      details: {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        ...context,
      },
      originalError: error,
    };
  }

  // その他のエラー
  return {
    message: typeof error === 'string' ? error : 'Unknown error occurred',
    code,
    statusCode,
    details: {
      type: typeof error,
      ...context,
    },
    originalError: error,
  };
}

/**
 * エラーの重要度を判定
 */
function determineErrorSeverity(error: HandledError): ErrorSeverity {
  // 5xx系 - Critical または Error
  if (error.statusCode >= 500) {
    return ErrorSeverity.CRITICAL;
  }

  // 4xx系 - Error または Warning
  if (error.statusCode >= 400) {
    // 認証・認可エラーは Warning
    if (error.code === ApiErrorCode.UNAUTHORIZED || error.code === ApiErrorCode.FORBIDDEN) {
      return ErrorSeverity.WARNING;
    }
    // バリデーションエラーも Warning
    if (error.code === ApiErrorCode.VALIDATION_ERROR) {
      return ErrorSeverity.WARNING;
    }
    return ErrorSeverity.ERROR;
  }

  return ErrorSeverity.INFO;
}

/**
 * エラーをログに記録 (将来的にはロギングシステムと統合)
 */
function logError(error: HandledError, severity: ErrorSeverity, context?: ErrorContext): void {
  const logData = {
    severity,
    timestamp: new Date().toISOString(),
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    context,
    details: error.details,
  };

  // 開発環境では詳細にログ出力
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Handler]', logData);
    if (error.originalError) {
      console.error('[Original Error]', error.originalError);
    }
  } else {
    // 本番環境では重要度に応じてログ出力
    if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.ERROR) {
      console.error('[Error]', JSON.stringify(logData));
    } else if (severity === ErrorSeverity.WARNING) {
      console.warn('[Warning]', JSON.stringify(logData));
    }
  }

  // TODO: 将来的には外部ロギングサービス (Sentry, Datadog等) に送信
}

/**
 * APIエラーハンドラー - NextResponse形式でエラーを返す
 *
 * @param error 発生したエラー
 * @param context エラーコンテキスト
 * @returns NextResponse
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   try {
 *     const data = await request.json();
 *     const result = await createPost(data);
 *     return handleSuccess(result);
 *   } catch (error) {
 *     return handleApiError(error, { location: '/api/posts' });
 *   }
 * }
 * ```
 */
export function handleApiError(error: unknown, context?: ErrorContext): NextResponse {
  const handledError = normalizeError(error, context);
  const severity = determineErrorSeverity(handledError);

  // エラーをログに記録
  logError(handledError, severity, context);

  // APIエラーレスポンスを構築
  const apiError: ApiError = {
    success: false,
    error: handledError.message,
    code: handledError.code,
    ...(process.env.NODE_ENV === 'development' && handledError.details
      ? { details: handledError.details }
      : {}),
  };

  return NextResponse.json(apiError, { status: handledError.statusCode });
}

/**
 * クライアントエラーハンドラー - エラー情報を返す (Responseは返さない)
 *
 * @param error 発生したエラー
 * @param context エラーコンテキスト
 * @returns HandledError
 *
 * @example
 * ```typescript
 * try {
 *   await fetchComments();
 * } catch (error) {
 *   const handledError = handleClientError(error, { component: 'Comments' });
 *   setErrorMessage(handledError.message);
 *   setErrorCode(handledError.code);
 * }
 * ```
 */
export function handleClientError(error: unknown, context?: ErrorContext): HandledError {
  const handledError = normalizeError(error, context);
  const severity = determineErrorSeverity(handledError);

  // エラーをログに記録
  logError(handledError, severity, context);

  return handledError;
}

/**
 * 成功レスポンスハンドラー - NextResponse形式で成功レスポンスを返す
 *
 * @param data レスポンスデータ
 * @param message オプションのメッセージ
 * @param statusCode HTTPステータスコード (デフォルト: 200)
 * @returns NextResponse
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const posts = await fetchPosts();
 *   return handleSuccess(posts, 'Posts fetched successfully');
 * }
 * ```
 */
export function handleSuccess<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse {
  const apiSuccess: ApiSuccess<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };

  return NextResponse.json(apiSuccess, { status: statusCode });
}

/**
 * カスタムエラー作成ヘルパー - 特定のエラータイプを簡単に作成
 */
export const createUnifiedError = {
  /**
   * バリデーションエラー
   */
  validation(message: string, details?: Record<string, unknown>): HandledError {
    return {
      message,
      code: ApiErrorCode.VALIDATION_ERROR,
      statusCode: 400,
      details,
    };
  },

  /**
   * 認証エラー
   */
  unauthorized(message: string = 'Unauthorized'): HandledError {
    return {
      message,
      code: ApiErrorCode.UNAUTHORIZED,
      statusCode: 401,
    };
  },

  /**
   * 権限エラー
   */
  forbidden(message: string = 'Forbidden'): HandledError {
    return {
      message,
      code: ApiErrorCode.FORBIDDEN,
      statusCode: 403,
    };
  },

  /**
   * 未検出エラー
   */
  notFound(resource: string = 'Resource'): HandledError {
    return {
      message: `${resource} not found`,
      code: ApiErrorCode.NOT_FOUND,
      statusCode: 404,
    };
  },

  /**
   * レート制限エラー
   */
  rateLimit(message: string = 'Rate limit exceeded'): HandledError {
    return {
      message,
      code: ApiErrorCode.RATE_LIMIT_EXCEEDED,
      statusCode: 429,
    };
  },

  /**
   * 内部エラー
   */
  internal(message: string = 'Internal server error', details?: Record<string, unknown>): HandledError {
    return {
      message,
      code: ApiErrorCode.INTERNAL_ERROR,
      statusCode: 500,
      details,
    };
  },
};

/**
 * エラーハンドラーのミドルウェア - APIルートハンドラーをラップ
 *
 * @example
 * ```typescript
 * export const GET = withErrorHandler(async (request: Request) => {
 *   const data = await fetchData();
 *   return handleSuccess(data);
 * }, { location: '/api/data' });
 * ```
 */
export function withErrorHandler(
  handler: (request: Request, context?: unknown) => Promise<NextResponse>,
  errorContext?: ErrorContext
) {
  return async (request: Request, context?: unknown): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error, errorContext);
    }
  };
}
